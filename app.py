"""
Comal Dorado - Servidor del sitio web y sistema de pedidos.

Cómo correrlo:
    pip install flask
    python app.py
Luego abre  http://localhost:5000        (sitio para clientes)
        y   http://localhost:5000/cocina (panel de cocina, PIN por defecto: 1234)
"""
import json
import os
import secrets
import sqlite3
import string
from contextlib import closing
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR permite conservar los pedidos cuando se publica el sitio en un
# servicio con disco persistente. En uso local sigue guardándose junto a app.py.
DATA_DIR = os.environ.get("DATA_DIR", BASE)
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "pedidos.db")
PIN_COCINA = os.environ.get("PIN_COCINA", "1234")

app = Flask(__name__, static_folder="static", static_url_path="")

# ----------------------------------------------------------------------------
# DATOS DEL NEGOCIO  (cámbialos por los de tu pupusería real)
# ----------------------------------------------------------------------------
NEGOCIO = {
    "nombre": "Comal Dorado",
    "eslogan": "Pupusas hechas a mano, a la vista del comal",
    "horario": "Martes a domingo · 4:00 pm a 10:00 pm",
    "direccion": "Calle Principal #123, Apopa, San Salvador",
    "telefono": "7000-0000",
    "whatsapp": "50370000000",
}
COSTO_DOMICILIO = 1.00
TIPOS = {"aqui": "Comer aquí", "llevar": "Para llevar", "domicilio": "Domicilio"}
ESTADOS = ["nuevo", "preparando", "listo", "entregado", "cancelado"]

# Los precios salen de tu algoritmo en PSeInt. Aquí el servidor es el que manda:
# el navegador nunca decide cuánto cuesta algo.
PRODUCTOS = [
    {"id": "p1", "cat": "pupusas", "grupo": "clasicas", "art": "pupusa", "color": "#b8452c",
     "nombre": "Revueltas", "precio": 0.70,
     "desc": "La reina de la casa: chicharrón, frijol y queso en una sola mordida."},
    {"id": "p2", "cat": "pupusas", "grupo": "clasicas", "art": "pupusa", "color": "#7a4a30",
     "nombre": "Frijol con queso", "precio": 0.70,
     "desc": "Frijol molido sedoso con queso que se estira. Clásico que nunca falla."},
    {"id": "p3", "cat": "pupusas", "grupo": "clasicas", "art": "pupusa", "color": "#f6d767",
     "nombre": "Queso", "precio": 1.00,
     "desc": "Queso derretido hasta el borde. Simple, dorada, perfecta."},
    {"id": "p4", "cat": "pupusas", "grupo": "carnes", "art": "pupusa", "color": "#c46a3b",
     "nombre": "Chicharrón con queso", "precio": 1.00,
     "desc": "Chicharrón molido con queso: crujiente, jugosa y con carácter."},
    {"id": "p5", "cat": "pupusas", "grupo": "huerto", "art": "pupusa", "color": "#4f7d36",
     "nombre": "Mora", "precio": 1.00,
     "desc": "Hierbamora con queso. Sabor de huerto, muy fresca."},
    {"id": "p6", "cat": "pupusas", "grupo": "huerto", "art": "pupusa", "color": "#e8962b",
     "nombre": "Ayote", "precio": 1.00,
     "desc": "Ayote tierno con queso, dulce y suave. La favorita de los que dudan."},
    {"id": "p7", "cat": "pupusas", "grupo": "huerto", "art": "pupusa", "color": "#8aa64b",
     "nombre": "Papelillo", "precio": 0.70,
     "desc": "Receta tradicional de la casa. Pregunta por ella, es de las que enamoran."},
    {"id": "p8", "cat": "pupusas", "grupo": "carnes", "art": "pupusa", "color": "#ee7f62",
     "nombre": "Camarón", "precio": 1.25,
     "desc": "Camarón con queso. La más fina del comal."},
    {"id": "p9", "cat": "pupusas", "grupo": "huerto", "art": "pupusa", "color": "#e9dfbf",
     "nombre": "Ajo", "precio": 0.70,
     "desc": "Ajo con queso. Para valientes que no le tienen miedo al aliento."},
    {"id": "p10", "cat": "pupusas", "grupo": "carnes", "art": "pupusa", "color": "#e5bd85",
     "nombre": "Pollo", "precio": 1.00,
     "desc": "Pollo desmenuzado con queso. Ligera, jugosa, muy suave."},
    # Bebidas y extras de ejemplo: cambia nombres y precios a tu gusto
    {"id": "b1", "cat": "bebidas", "art": "horchata", "color": "#f2dfb8",
     "nombre": "Horchata de morro", "precio": 1.00, "desc": ""},
    {"id": "b2", "cat": "bebidas", "art": "horchata", "color": "#e8412c",
     "nombre": "Refresco de ensalada", "precio": 1.00, "desc": ""},
    {"id": "b3", "cat": "bebidas", "art": "horchata", "color": "#6b4226",
     "nombre": "Café de olla", "precio": 0.50, "desc": ""},
    {"id": "e1", "cat": "extras", "art": "curtido", "color": "#8bc34a",
     "nombre": "Curtido extra", "precio": 0.25, "desc": ""},
    {"id": "e2", "cat": "extras", "art": "salsa", "color": "#e8412c",
     "nombre": "Salsa roja extra", "precio": 0.25, "desc": ""},
]
POR_ID = {p["id"]: p for p in PRODUCTOS}


# ----------------------------------------------------------------------------
# BASE DE DATOS (SQLite viene incluida con Python, no hay que instalar nada)
# ----------------------------------------------------------------------------
def consulta(sql, args=(), uno=False, escribir=False):
    with closing(sqlite3.connect(DB_PATH)) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute(sql, args)
        if escribir:
            con.commit()
            return cur.lastrowid
        filas = cur.fetchall()
        return (filas[0] if filas else None) if uno else filas


def iniciar_db():
    consulta(
        """CREATE TABLE IF NOT EXISTS pedidos (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo    TEXT UNIQUE NOT NULL,
            nombre    TEXT NOT NULL,
            telefono  TEXT NOT NULL,
            tipo      TEXT NOT NULL,
            direccion TEXT,
            notas     TEXT,
            lineas    TEXT NOT NULL,
            total     REAL NOT NULL,
            estado    TEXT NOT NULL DEFAULT 'nuevo',
            creado    TEXT NOT NULL
        )""",
        escribir=True,
    )


def nuevo_codigo():
    letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        codigo = "PUP-" + "".join(secrets.choice(letras) for _ in range(4))
        if not consulta("SELECT 1 FROM pedidos WHERE codigo=?", (codigo,), uno=True):
            return codigo


def fila_a_dict(f):
    return {
        "codigo": f["codigo"], "nombre": f["nombre"], "telefono": f["telefono"],
        "tipo": f["tipo"], "tipo_texto": TIPOS.get(f["tipo"], f["tipo"]),
        "direccion": f["direccion"], "notas": f["notas"],
        "lineas": json.loads(f["lineas"]), "total": f["total"],
        "estado": f["estado"], "creado": f["creado"], "id": f["id"],
    }


# ----------------------------------------------------------------------------
# RUTAS: PÁGINAS
# ----------------------------------------------------------------------------
@app.get("/")
def inicio():
    return send_from_directory("static", "index.html")


@app.get("/cocina")
def cocina():
    # No permitir que un navegador reutilice una copia anterior del panel sin
    # volver a ejecutar la pantalla de PIN.
    respuesta = send_from_directory("static", "cocina.html")
    respuesta.headers["Cache-Control"] = "no-store, max-age=0"
    return respuesta


@app.get("/api/salud")
def salud():
    """Comprobación simple para el servicio de despliegue."""
    return jsonify(ok=True)


# ----------------------------------------------------------------------------
# RUTAS: API PARA CLIENTES
# ----------------------------------------------------------------------------
@app.get("/api/menu")
def api_menu():
    return jsonify(negocio=NEGOCIO, productos=PRODUCTOS,
                   domicilio=COSTO_DOMICILIO, tipos=TIPOS)


@app.post("/api/pedido")
def crear_pedido():
    datos = request.get_json(silent=True) or {}
    nombre = str(datos.get("nombre", "")).strip()[:60]
    telefono = "".join(c for c in str(datos.get("telefono", "")) if c.isdigit())
    tipo = datos.get("tipo")
    direccion = str(datos.get("direccion", "")).strip()[:200]
    notas = str(datos.get("notas", "")).strip()[:300]

    errores = []
    if len(nombre) < 2:
        errores.append("Escribe tu nombre.")
    if not 8 <= len(telefono) <= 11:
        errores.append("Revisa tu teléfono (8 dígitos).")
    if tipo not in TIPOS:
        errores.append("Elige cómo quieres tu pedido.")
    if tipo == "domicilio" and len(direccion) < 6:
        errores.append("Para domicilio necesitamos tu dirección.")

    # Junta las líneas y recalcula todo con los precios DEL SERVIDOR
    cantidades = {}
    for it in datos.get("items", []) if isinstance(datos.get("items"), list) else []:
        pid, cant = (it or {}).get("id"), (it or {}).get("cantidad")
        if pid not in POR_ID or not isinstance(cant, int) or isinstance(cant, bool):
            continue
        if 1 <= cant <= 50:
            cantidades[pid] = min(50, cantidades.get(pid, 0) + cant)
    if not cantidades:
        errores.append("Agrega al menos un producto.")
    if sum(cantidades.values()) > 100:
        errores.append("Para pedidos de más de 100 productos, llámanos.")
    if errores:
        return jsonify(errores=errores), 400

    lineas, centavos = [], 0
    for pid, cant in cantidades.items():
        p = POR_ID[pid]
        lineas.append({"id": pid, "nombre": p["nombre"], "cantidad": cant, "precio": p["precio"]})
        centavos += round(p["precio"] * 100) * cant
    if tipo == "domicilio":
        centavos += round(COSTO_DOMICILIO * 100)
    total = centavos / 100

    codigo = nuevo_codigo()
    consulta(
        """INSERT INTO pedidos (codigo,nombre,telefono,tipo,direccion,notas,lineas,total,creado)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (codigo, nombre, telefono, tipo, direccion if tipo == "domicilio" else "",
         notas, json.dumps(lineas, ensure_ascii=False), total,
         datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        escribir=True,
    )
    f = consulta("SELECT * FROM pedidos WHERE codigo=?", (codigo,), uno=True)
    return jsonify(pedido=fila_a_dict(f), posicion=_posicion(f)), 201


def _posicion(f):
    """Cuántos pedidos van antes que este (solo si aún no está listo)."""
    if f["estado"] not in ("nuevo", "preparando"):
        return 0
    r = consulta(
        "SELECT COUNT(*) AS n FROM pedidos WHERE id<? AND estado IN ('nuevo','preparando')",
        (f["id"],), uno=True)
    return r["n"]


@app.get("/api/pedido/<codigo>")
def ver_pedido(codigo):
    f = consulta("SELECT * FROM pedidos WHERE codigo=?", (codigo.upper(),), uno=True)
    if not f:
        return jsonify(errores=["No encontramos ese pedido."]), 404
    return jsonify(pedido=fila_a_dict(f), posicion=_posicion(f))


# ----------------------------------------------------------------------------
# RUTAS: API DE COCINA (protegidas con PIN)
# ----------------------------------------------------------------------------
def autorizado():
    pin = request.headers.get("X-PIN", "").encode()
    return secrets.compare_digest(pin, PIN_COCINA.encode())


@app.get("/api/cocina/pedidos")
def cocina_pedidos():
    if not autorizado():
        return jsonify(errores=["PIN incorrecto"]), 401
    filas = consulta("SELECT * FROM pedidos ORDER BY id DESC LIMIT 80")
    return jsonify(pedidos=[fila_a_dict(f) for f in filas])


@app.post("/api/cocina/pedidos/<codigo>/estado")
def cocina_estado(codigo):
    if not autorizado():
        return jsonify(errores=["PIN incorrecto"]), 401
    estado = (request.get_json(silent=True) or {}).get("estado")
    if estado not in ESTADOS:
        return jsonify(errores=["Estado inválido"]), 400
    consulta("UPDATE pedidos SET estado=? WHERE codigo=?", (estado, codigo.upper()), escribir=True)
    return jsonify(ok=True)


iniciar_db()

if __name__ == "__main__":
    print("\n  Sitio:   http://localhost:5000")
    print("  Cocina:  http://localhost:5000/cocina\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
