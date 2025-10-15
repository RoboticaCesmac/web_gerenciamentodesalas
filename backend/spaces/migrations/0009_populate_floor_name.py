from django.db import migrations

def populate_floor_name(apps, schema_editor):
    Space = apps.get_model('spaces', 'Space')
    for space in Space.objects.all():
        space.floor_name = "Térreo"
        space.save()

def reverse_floor_name(apps, schema_editor):
    Space = apps.get_model('spaces', 'Space')
    Space.objects.all().update(floor_name=None)

class Migration(migrations.Migration):
    dependencies = [
        ('spaces', '0008_add_floor_name'),  # Reference the previous migration
    ]

    operations = [
        migrations.RunPython(populate_floor_name, reverse_floor_name),
    ]