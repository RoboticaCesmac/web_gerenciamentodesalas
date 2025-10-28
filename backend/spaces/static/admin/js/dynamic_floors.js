django.jQuery(document).ready(function($) {
    const buildingSelect = $('#id_building');
    const floorSelect = $('#id_floor_name');

    function updateFloorChoices() {
        const buildingId = buildingSelect.val();
        if (buildingId) {
            $.get('/admin/spaces/get-floors/', { building_id: buildingId })
                .done(function(data) {
                    floorSelect.empty();
                    floorSelect.append($('<option value="">---------</option>'));
                    data.floors.forEach(function(floor) {
                        floorSelect.append(
                            $('<option></option>')
                                .attr('value', floor.id)
                                .text(`${floor.building_name} - ${floor.name}`)
                        );
                    });
                });
        } else {
            floorSelect.empty();
            floorSelect.append($('<option value="">---------</option>'));
        }
    }

    buildingSelect.on('change', updateFloorChoices);
});