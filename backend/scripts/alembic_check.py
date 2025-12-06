#!/usr/bin/env python3
"""
Herramienta ligera para inspeccionar (y opcionalmente limpiar) la tabla alembic_version

Uso:
  python alembic_check.py --show
  python alembic_check.py --delete    # eliminará todas las filas (PELIGRO)

El script usa la variable de entorno DATABASE_URL (o carga .env automáticamente).
"""
import os
import sys
import argparse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


def main():
    parser = argparse.ArgumentParser(description='Check alembic_version table')
    parser.add_argument('--show', action='store_true', help='Mostrar filas en alembic_version')
    parser.add_argument('--delete', action='store_true', help='Eliminar todas las filas en alembic_version (peligroso)')
    args = parser.parse_args()

    # Cargar .env si existe
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print('ERROR: no se encontró DATABASE_URL en el entorno. Crea backend/.env o exporta la variable.', file=sys.stderr)
        sys.exit(2)

    print('Conectando a:', db_url)
    try:
        engine = create_engine(db_url)
    except Exception as e:
        print('Error creando engine:', e, file=sys.stderr)
        sys.exit(3)

    try:
        with engine.connect() as conn:
            # Verificar existencia de la tabla
            try:
                res = conn.execute(text('SELECT version_num FROM alembic_version'))
                rows = res.fetchall()
                if args.show:
                    if not rows:
                        print('La tabla alembic_version está vacía.')
                    else:
                        print('Filas en alembic_version:')
                        for r in rows:
                            print(' -', r[0])
                if args.delete:
                    confirm = input('CONFIRMAR BORRADO de alembic_version (type YES to proceed): ')
                    if confirm == 'YES':
                        conn.execute(text('DELETE FROM alembic_version'))
                        conn.commit()
                        print('Se eliminaron las filas de alembic_version.')
                    else:
                        print('Operación cancelada.')
            except Exception as e:
                print('Error consultando alembic_version:', e, file=sys.stderr)
                sys.exit(4)
    except Exception as e:
        print('Error conectando a la base de datos:', e, file=sys.stderr)
        sys.exit(5)


if __name__ == '__main__':
    main()
