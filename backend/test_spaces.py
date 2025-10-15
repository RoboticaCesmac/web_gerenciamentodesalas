import requests
import json
from datetime import datetime, timedelta
import pytz

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

def test_user_reservations(headers):
    print("\nTestando endpoint de reservas...")
    try:
        response = requests.get(f"{BASE_URL}/reservations/", headers=headers)
        if response.status_code == 200:
            reservations = response.json()
            print(f"✅ Reservas encontradas: {len(reservations)}")
        else:
            print(f"❌ Erro ao buscar reservas: {response.status_code}")
            print(f"Detalhes: {response.text[:200]}...")  # Mostra apenas os primeiros 200 caracteres
    except Exception as e:
        print(f"❌ Erro na requisição: {str(e)}")

def check_existing_reservations():
    """Verifica reservas existentes para debug"""
    print("\n🔍 Verificando reservas existentes...")
    
    token = get_auth_token()
    if not token:
        return
        
    headers = {"Authorization": f"Token {token}"}
    
    response = requests.get(f"{BASE_URL}/reservations/", headers=headers)
    if response.status_code == 200:
        reservations = response.json()
        print(f"📋 Total de reservas: {len(reservations)}")
        
        for i, reservation in enumerate(reservations[:5]):  # Mostrar apenas as 5 primeiras
            print(f"  {i+1}. {reservation.get('title', 'Sem título')}")
            print(f"     Sala: {reservation.get('space_name')}")
            print(f"     Início: {reservation.get('start_datetime')}")
            print(f"     Fim: {reservation.get('end_datetime')}")
            print(f"     Status: {reservation.get('status')}")
            print()
    else:
        print(f"❌ Erro ao buscar reservas: {response.status_code}")

def test_create_reservation():
    print("\nTestando criação de reserva...")
    
    token = get_auth_token()
    if not token:
        print("❌ Não foi possível obter o token")
        return
        
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Get first space
    response = requests.get(f"{BASE_URL}/spaces/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Erro ao buscar salas: {response.status_code}")
        return
    
    spaces = response.json()
    if not spaces:
        print("❌ Nenhuma sala encontrada")
        return
    
    space = spaces[0]
    space_id = space['id']
    
    print(f"🔍 Usando sala com ID: {space_id}")
    
    # Usar horários futuros e consistentes
    try:
        tz = pytz.timezone('America/Sao_Paulo')  # Ou seu fuso horário
    except:
        tz = pytz.UTC
    
    now = datetime.now(tz)
    start_time = now + timedelta(days=1, hours=10)  # Amanhã às 10:00
    end_time = start_time + timedelta(hours=1)      # Duração de 1 hora
    
    reservation_data = {
        "space": space_id,
        "start_datetime": start_time.isoformat(),
        "end_datetime": end_time.isoformat(),
        "title": "Teste de Reserva Automatizada",
        "description": "Reserva criada pelo teste automatizado - horário futuro"
    }
    
    try:
        print("\n📤 Enviando dados:")
        print(json.dumps(reservation_data, indent=2))
        
        # Primeiro, verificar disponibilidade
        print("\n🔍 Verificando disponibilidade...")
        availability_url = f"{BASE_URL}/spaces/{space_id}/availability/"
        params = {
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat()
        }
        availability_response = requests.get(availability_url, headers=headers, params=params)
        
        if availability_response.status_code == 200:
            availability_data = availability_response.json()
            print(f"📊 Disponibilidade: {availability_data}")
            
            if availability_data.get('is_available', False):
                print("✅ Sala disponível! Criando reserva...")
                response = requests.post(
                    f"{BASE_URL}/reservations/",
                    headers=headers,
                    json=reservation_data
                )
                
                print(f"\n📥 Status: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    print("✅ Reserva criada com sucesso!")
                    print(f"ID: {response.json().get('id')}")
                else:
                    print("❌ Erro ao criar reserva")
                    print(f"Código: {response.status_code}")
                    print(f"Resposta: {response.text}")
            else:
                print("❌ Sala não disponível no horário solicitado")
                print("Tentando outro horário...")
                
                # Tentar horário alternativo
                start_time_alt = now + timedelta(days=1, hours=14)  # Amanhã às 14:00
                end_time_alt = start_time_alt + timedelta(hours=1)
                
                reservation_data_alt = {
                    "space": space_id,
                    "start_datetime": start_time_alt.isoformat(),
                    "end_datetime": end_time_alt.isoformat(),
                    "title": "Teste de Reserva Automatizada - Horário Alternativo",
                    "description": "Reserva criada pelo teste automatizado - segundo horário tentado"
                }
                
                print(f"\n🕐 Tentando horário alternativo: {start_time_alt.strftime('%Y-%m-%d %H:%M')}")
                
                # Verificar disponibilidade do horário alternativo
                params_alt = {
                    'start_time': start_time_alt.isoformat(),
                    'end_time': end_time_alt.isoformat()
                }
                availability_alt = requests.get(availability_url, headers=headers, params=params_alt)
                
                if availability_alt.status_code == 200 and availability_alt.json().get('is_available', False):
                    response = requests.post(
                        f"{BASE_URL}/reservations/",
                        headers=headers,
                        json=reservation_data_alt
                    )
                    
                    print(f"📥 Status: {response.status_code}")
                    if response.status_code in [200, 201]:
                        print("✅ Reserva criada com sucesso no horário alternativo!")
                        print(f"ID: {response.json().get('id')}")
                    else:
                        print("❌ Erro ao criar reserva no horário alternativo")
                        print(f"Resposta: {response.text}")
                else:
                    print("❌ Sala também não disponível no horário alternativo")
                    print("Sugestão: Tente manualmente com um horário diferente")
        else:
            print(f"❌ Erro ao verificar disponibilidade: {availability_response.status_code}")
            print(f"Detalhes: {availability_response.text}")
            
    except Exception as e:
        print(f"❌ Erro na requisição: {str(e)}")
        print(f"Tipo do erro: {type(e).__name__}")

def test_reservation_with_specific_space(space_id):
    """Testa criação de reserva com uma sala específica"""
    print(f"\n🎯 Testando reserva com sala específica ID: {space_id}")
    
    token = get_auth_token()
    if not token:
        print("❌ Não foi possível obter o token")
        return
        
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Verificar se a sala existe
    response = requests.get(f"{BASE_URL}/spaces/{space_id}/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Sala {space_id} não encontrada")
        return
    
    space = response.json()
    print(f"🔍 Sala encontrada: {space.get('name')}")
    
    # Usar horários futuros
    try:
        tz = pytz.timezone('America/Sao_Paulo')
    except:
        tz = pytz.UTC
    
    now = datetime.now(tz)
    
    # Tentar vários horários diferentes
    time_slots = [
        (now + timedelta(days=2, hours=9)),   # Depois de amanhã 9:00
        (now + timedelta(days=2, hours=11)),  # Depois de amanhã 11:00
        (now + timedelta(days=3, hours=10)),  # 3 dias à frente 10:00
    ]
    
    for i, start_time in enumerate(time_slots):
        end_time = start_time + timedelta(hours=1.5)
        
        reservation_data = {
            "space": space_id,
            "start_datetime": start_time.isoformat(),
            "end_datetime": end_time.isoformat(),
            "title": f"Teste Reserva Slot {i+1}",
            "description": f"Reserva automática - slot de teste {i+1}"
        }
        
        print(f"\n🕐 Tentando slot {i+1}: {start_time.strftime('%Y-%m-%d %H:%M')}")
        
        # Verificar disponibilidade
        availability_url = f"{BASE_URL}/spaces/{space_id}/availability/"
        params = {
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat()
        }
        
        availability_response = requests.get(availability_url, headers=headers, params=params)
        
        if availability_response.status_code == 200:
            availability_data = availability_response.json()
            
            if availability_data.get('is_available', False):
                response = requests.post(
                    f"{BASE_URL}/reservations/",
                    headers=headers,
                    json=reservation_data
                )
                
                if response.status_code in [200, 201]:
                    print(f"✅ Reserva criada com sucesso no slot {i+1}!")
                    print(f"ID: {response.json().get('id')}")
                    return  # Sai após sucesso
                else:
                    print(f"❌ Erro no slot {i+1}: {response.status_code}")
                    print(f"Resposta: {response.text[:100]}...")
            else:
                print(f"❌ Slot {i+1} indisponível")
        else:
            print(f"❌ Erro ao verificar disponibilidade slot {i+1}")
    
    print("❌ Não foi possível criar reserva em nenhum slot tentado")

def main():
    print("🔐 Obtendo token de autenticação...")
    token = get_auth_token()
    
    if not token:
        return
    
    headers = {"Authorization": f"Token {token}"}
    
    print("\n🚀 Testando endpoints da API...")
    
    # Primeiro, verificar reservas existentes
    check_existing_reservations()
    
    # Depois testar os endpoints
    test_endpoint(f"{BASE_URL}/buildings/", headers, "Prédios")
    test_endpoint(f"{BASE_URL}/space-types/", headers, "Tipos de Espaço")
    test_endpoint(f"{BASE_URL}/spaces/", headers, "Espaços")
    test_endpoint(f"{BASE_URL}/reservations/", headers, "Reservas")
    test_user_reservations(headers)
    test_create_reservation()  # Agora com verificação de disponibilidade
    
    # Teste adicional com sala específica (opcional)
    # test_reservation_with_specific_space(7)  # Descomente e ajuste o ID se necessário
    
    print("\n📋 Teste completo!")

if __name__ == "__main__":
    main()
    test_building_endpoints()