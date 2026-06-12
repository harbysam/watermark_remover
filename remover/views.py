from pathlib import Path

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .processing import encode_image, remove_watermark


@ensure_csrf_cookie
def index(request):
    return render(request, 'remover/index.html')


@require_http_methods(['POST'])
def process(request):
    image_file = request.FILES.get('image')
    mask_file = request.FILES.get('mask')

    if not image_file or not mask_file:
        return HttpResponse('Gorsel ve maske gerekli.', status=400)

    try:
        image_bytes = image_file.read()
        result = remove_watermark(image_bytes, mask_file.read())
        out_bytes, mime, output_name = encode_image(result, image_file.name)
    except ValueError as exc:
        return HttpResponse(str(exc), status=400)

    response = HttpResponse(out_bytes, content_type=mime)
    response['Content-Disposition'] = f'inline; filename="{output_name}"'
    response['X-Output-Filename'] = output_name
    return response
