#!/usr/bin/env python3
"""
Script para criar usuário administrador inicial no DrWell.

Uso:
    python init-admin.py

Ou dentro do container:
    docker exec -it $(docker ps -q -f name=drwell_api) python init-admin.py
"""

import os
import sys
from getpass import getpass

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.law_firm import LawFirm


def create_admin_user():
    """Create initial admin user"""

    print("=" * 60)
    print("DrWell - Criação de Usuário Administrador Inicial")
    print("=" * 60)
    print()

    db = SessionLocal()

    try:
        # Check if any user exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  ATENÇÃO: Já existem usuários cadastrados no sistema.")
            response = input("Deseja criar um novo usuário mesmo assim? (s/N): ")
            if response.lower() != 's':
                print("Operação cancelada.")
                return

        print("Por favor, forneça os dados do usuário administrador:\n")

        # Get user data
        email = input("Email: ")
        username = input("Username: ")
        full_name = input("Nome completo: ")

        # Password with confirmation
        while True:
            password = getpass("Senha: ")
            password_confirm = getpass("Confirme a senha: ")

            if password != password_confirm:
                print("❌ As senhas não coincidem. Tente novamente.\n")
                continue

            if len(password) < 8:
                print("❌ A senha deve ter pelo menos 8 caracteres.\n")
                continue

            break

        # Create law firm (optional)
        print("\n" + "-" * 60)
        print("Deseja criar um escritório agora? (opcional)")
        create_firm = input("Criar escritório? (s/N): ")

        law_firm_id = None
        if create_firm.lower() == 's':
            firm_name = input("Nome do escritório: ")
            firm_cnpj = input("CNPJ (opcional): ")
            firm_email = input("Email do escritório (opcional): ")

            law_firm = LawFirm(
                name=firm_name,
                cnpj=firm_cnpj if firm_cnpj else None,
                email=firm_email if firm_email else None
            )
            db.add(law_firm)
            db.flush()  # Get the ID
            law_firm_id = law_firm.id
            print(f"✓ Escritório '{firm_name}' criado com ID: {law_firm_id}")

        # Create user
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role="master",
            is_active=True,
            is_superuser=True,
            law_firm_id=law_firm_id
        )

        db.add(user)
        db.commit()

        print("\n" + "=" * 60)
        print("✓ Usuário administrador criado com sucesso!")
        print("=" * 60)
        print(f"\nDados de acesso:")
        print(f"  Email/Username: {username}")
        print(f"  Senha: [informada acima]")
        print(f"  Role: master (administrador)")
        if law_firm_id:
            print(f"  Escritório ID: {law_firm_id}")
        print()
        print("Use estas credenciais para fazer login na API:")
        print(f"  POST https://seu-dominio.com/api/v1/auth/login")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao criar usuário: {str(e)}")
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    try:
        create_admin_user()
    except KeyboardInterrupt:
        print("\n\nOperação cancelada pelo usuário.")
        sys.exit(0)
