# Sistema de Gerenciamento de Salas - CESMAC

## Descrição
Sistema para gerenciamento de reservas de salas e espaços do CESMAC, com interface administrativa e API REST.

## Requisitos
- Python 3.11+
- Django 4.2.7+
- Node.js 16+
- NPM 8+

## Instalação

### Backend (Django)

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sist-ger-sala.git
cd sist-ger-sala
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
```

3. Ative o ambiente virtual:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

5. Execute as migrações:
```bash
cd backend
python manage.py migrate
```

6. Crie um superusuário:
```bash
python manage.py createsuperuser
```

7. Execute o servidor:
```bash
python manage.py runserver
```

## Estrutura do Projeto

### Principais Apps

#### Spaces
Gerencia espaços, reservas e configurações relacionadas.

- `Building`: Representa os prédios/campus
- `FloorPlan`: Plantas dos andares com imagens
- `Space`: Salas e espaços disponíveis
- `Reservation`: Reservas de espaços
- `SpaceType`: Tipos de espaços (sala, laboratório, etc.)

#### Accounts
Gerencia autenticação e usuários.

- `CustomUser`: Modelo de usuário personalizado
- Autenticação via email institucional (@cesmac.edu.br)

## Funcionalidades Principais

### Gerenciamento de Espaços

1. **Adicionar/Editar Espaço**
```python
# Exemplo de criação de espaço
space = Space.objects.create(
    building=building,
    floor=floor_plan,
    space_type=space_type,
    name="Lab 1",
    capacity=30
)
```

2. **Plantas dos Andares**
- Suporte para upload de imagens
- Marcação visual de localização dos espaços
- Preview interativo no admin

### Sistema de Reservas

1. **Criar Reserva**
```python
# Exemplo de reserva
reservation = Reservation.objects.create(
    space=space,
    user=user,
    start_datetime=start,
    end_datetime=end,
    title="Aula de Programação",
    description="Aula prática"
)
```

2. **Tipos de Reserva**
- Única: Data e hora específicas
- Recorrente: Repetição semanal com data de término

### API Endpoints

1. **Autenticação**
- `POST /api/auth/login/`: Login com email institucional
- `POST /api/auth/register/`: Registro de novo usuário
- `POST /api/auth/logout/`: Logout

2. **Espaços**
- `GET /api/buildings/`: Lista de prédios
- `GET /api/spaces/`: Lista de espaços
- `GET /api/floor-plans/<id>/`: Detalhes da planta
- `GET /api/floors/<id>/spaces/`: Espaços por andar

3. **Reservas**
- `GET /api/reservations/`: Lista de reservas
- `POST /api/reservations/`: Criar reserva
- `PUT /api/reservations/<id>/`: Atualizar reserva
- `DELETE /api/reservations/<id>/`: Cancelar reserva

## Interface Administrativa

### Características
- Visualização de plantas dos andares
- Seleção visual de localização dos espaços
- Gestão de reservas com status
- Filtros por prédio, andar e tipo de espaço

### Personalização
- Tema AdminLTE3
- Widgets personalizados para seleção de localização
- Preview de imagens e plantas

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença
sem licença no momento
