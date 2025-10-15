from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('spaces', '0007_alter_reservation_status'),  # Reference the last existing migration
    ]

    operations = [
        migrations.AddField(
            model_name='space',
            name='floor_name',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]