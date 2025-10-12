import requests
import json

BASE_URL = "http://localhost:8000/api"
AUTH_URL = "http://localhost:8000/api/auth"

# Substitua com suas credenciais
EMAIL = "enzo.machado@cesmac.edu.br"
PASSWORD = "hgpvp123"

def get_auth_token():
    """Obtém token JWT"""
    login_data = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{AUTH_URL}/login/", json=login_data)
        if response.status_code == 200:
            print("✅ Login realizado com sucesso!")
            # Alterado aqui - pegando o token diretamente
            return response.json()['token']
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(response.json())
            return None
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def test_endpoint(url, headers, name):
    """Testa um endpoint específico"""
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print(f"✅ {name}: SUCCESSO")
            data = response.json()
            print(f"   Resultados: {len(data)} itens")
            for item in data[:3]:  # Mostra apenas os primeiros 3
                print(f"   - {item.get('name', item.get('title', 'Sem nome'))}")
            if len(data) > 3:
                print(f"   ... e mais {len(data) - 3} itens")
        else:
            print(f"❌ {name}: ERRO {response.status_code}")
            print(f"   Mensagem: {response.json()}")
    except Exception as e:
        print(f"❌ {name}: Erro de conexão - {e}")

def test_building_endpoints():
    print("\nTestando endpoints de prédios e salas...")
    
    token = get_auth_token()
    if not token:
        print("❌ Não foi possível obter o token")
        return
        
    # Alterado aqui - usando Token ao invés de Bearer
    headers = {"Authorization": f"Token {token}"}
    
    # Testar listagem de prédios
    response = requests.get(f"{BASE_URL}/buildings/", headers=headers)
    if response.status_code == 200:
        buildings = response.json()
        print(f"✅ Prédios encontrados: {len(buildings)}")
        
        # Se encontrou prédios, testar andares do primeiro prédio
        if buildings:
            building_id = buildings[0]['id']
            response = requests.get(f"{BASE_URL}/buildings/{building_id}/floors/", headers=headers)
            if response.status_code == 200:
                floors = response.json()
                print(f"✅ Andares encontrados para o prédio {building_id}: {len(floors)}")
                
                # Se encontrou andares, testar salas do primeiro andar
                if floors:
                    floor_id = floors[0]['id']
                    response = requests.get(f"{BASE_URL}/floors/{floor_id}/spaces/", headers=headers)
                    if response.status_code == 200:
                        spaces = response.json()
                        print(f"✅ Salas encontradas para o andar {floor_id}: {len(spaces)}")
                    else:
                        print(f"❌ Erro ao buscar salas: {response.status_code}")
            else:
                print(f"❌ Erro ao buscar andares: {response.status_code}")
    else:
        print(f"❌ Erro ao buscar prédios: {response.status_code}")

def main():
    print("🔐 Obtendo token de autenticação...")
    token = get_auth_token()
    
    if not token:
        return
    
    # Alterado aqui também
    headers = {"Authorization": f"Token {token}"}
    
    print("\n🚀 Testando endpoints da API...")
    
    # Testar cada endpoint
    test_endpoint(f"{BASE_URL}/buildings/", headers, "Prédios")
    test_endpoint(f"{BASE_URL}/space-types/", headers, "Tipos de Espaço")
    test_endpoint(f"{BASE_URL}/spaces/", headers, "Espaços")
    test_endpoint(f"{BASE_URL}/reservations/", headers, "Reservas")
    
    print("\n📋 Teste completo!")

if __name__ == "__main__":
    main()
    test_building_endpoints()