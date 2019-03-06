from django.conf.urls import url
from . import views

urlpatterns = [
    url(
        regex=r'^file/$',
        view=views.LoadFile.as_view(),
        name='file'
    ),
    url(
        regex=r'^ntf/$',
        view=views.RunRegNTF.as_view(),
        name='ntf'
    )    
]