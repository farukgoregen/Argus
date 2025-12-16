# Generated migration for SearchEvent model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SearchEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('query', models.CharField(help_text='The search query text', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(help_text='The user who performed this search', on_delete=django.db.models.deletion.CASCADE, related_name='search_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'search event',
                'verbose_name_plural': 'search events',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='searchevent',
            index=models.Index(fields=['user', '-created_at'], name='searchevent_user_created_idx'),
        ),
    ]
