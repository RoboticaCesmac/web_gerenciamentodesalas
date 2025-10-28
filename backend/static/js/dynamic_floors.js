django.jQuery(function($) {
    function updateFloorOptions() {
        var buildingSelect = $('#id_building');
        var floorSelect = $('#id_floor_name');
        var selectedBuilding = buildingSelect.val();

        if (selectedBuilding) {
            $.ajax({
                url: '/admin/spaces/floorplan/',
                data: {
                    building: selectedBuilding,
                    _to_field: 'id',
                },
                success: function(data) {
                    var options = '<option value="">---------</option>';
                    data.forEach(function(item) {
                        options += '<option value="' + item.id + '">' + item.floor_name + '</option>';
                    });
                    floorSelect.html(options);
                }
            });
        } else {
            floorSelect.html('<option value="">---------</option>');
        }
    }

    $('#id_building').change(updateFloorOptions);
});