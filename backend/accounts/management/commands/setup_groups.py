from django.core.management.base import BaseCommand
from accounts.fixtures.default_groups import create_default_groups

class Command(BaseCommand):
    help = 'Cria os grupos padrão com suas respectivas permissões'

    def handle(self, *args, **kwargs):
        self.stdout.write('Criando grupos padrão...')
        
        try:
            groups = create_default_groups()
            
            for group_name, group in groups.items():
                self.stdout.write(self.style.SUCCESS(
                    f'Grupo {group_name} criado com {group.permissions.count()} permissões'
                ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Erro: {str(e)}'))
            return
        
        self.stdout.write(self.style.SUCCESS('Grupos criados com sucesso!'))