django.jQuery(function($){
    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            
            reader.onload = function(e) {
                var previewDiv = $('#preview_image_wrapper');
                if (previewDiv.length === 0) {
                    previewDiv = $('<div id="preview_image_wrapper"><img style="max-width: 400px; max-height: 225px; object-fit: contain; margin-top: 10px;"/></div>');
                    $(input).after(previewDiv);
                }
                previewDiv.find('img').attr('src', e.target.result);
            }
            
            reader.readAsDataURL(input.files[0]);
        }
    }

    $('#id_plan_image').change(function() {
        readURL(this);
    });
});