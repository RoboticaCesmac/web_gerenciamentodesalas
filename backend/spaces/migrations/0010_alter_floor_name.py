from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('spaces', '0009_populate_floor_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='space',
            name='floor_name',
            field=models.CharField(max_length=50, default="Térreo"),
        ),
    ]