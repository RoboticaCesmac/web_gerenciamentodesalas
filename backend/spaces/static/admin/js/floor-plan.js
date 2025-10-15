django.jQuery(document).ready(function() {
    const buildingSelect = django.jQuery('select[name="building"]');
    const floorNameSelect = django.jQuery('select[name="floor_name"]');
    const locationX = django.jQuery('.coord-x');
    const locationY = django.jQuery('.coord-y');

    function loadFloorPlan() {
        const buildingId = buildingSelect.val();
        const floorName = floorNameSelect.val();

        if (buildingId && floorName) {
            django.jQuery.get('/admin/spaces/space/get_floor_plan/' + buildingId + '/' + encodeURIComponent(floorName) + '/', function(data) {
                if (data.image_url) {
                    var container = django.jQuery('#floor-plan-image');
                    if (container.length === 0) {
                        container = django.jQuery('<div id="floor-plan-image" style="position: relative; margin-top: 20px;"></div>');
                        floorNameSelect.parent().parent().append(container);
                    }
                    container.html('<img src="' + data.image_url + '" style="max-width: 100%; cursor: crosshair;">');
                    setupImageClick(container.find('img'));
                }
            });
        }
    }

    function setupImageClick(img) {
        img.on('click', function(e) {
            const rect = e.target.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
            const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

            locationX.val(x);
            locationY.val(y);

            django.jQuery('.location-marker').remove();

            const marker = django.jQuery('<div class="location-marker"></div>').css({
                position: 'absolute',
                left: x + '%',
                top: y + '%',
                width: '10px',
                height: '10px',
                backgroundColor: 'red',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
            });

            img.parent().append(marker);
        });
    }

    buildingSelect.on('change', function() {
        const buildingId = django.jQuery(this).val();
        if (buildingId) {
            django.jQuery.get('/api/buildings/' + buildingId + '/floors/', function(data) {
                floorNameSelect.empty().append('<option value="">---------</option>');
                data.forEach(function(floor) {
                    floorNameSelect.append(
                        '<option value="' + floor.name + '">' + floor.name + '</option>'
                    );
                });
                loadFloorPlan();
            });
        }
    });

    floorNameSelect.on('change', loadFloorPlan);

    if (buildingSelect.val() && floorNameSelect.val()) {
        loadFloorPlan();
    }
});