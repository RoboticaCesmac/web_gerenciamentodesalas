(function(django) {
    'use strict';
    
    django.jQuery(document).ready(function($) {
        console.log('Dynamic floors script loaded');
        
        function loadFloors() {
            var buildingId = django.jQuery('#id_building').val();
            console.log('Loading floors for building:', buildingId);
            
            if (buildingId) {
                django.jQuery.ajax({
                    url: '/admin/spaces/get-floors/',
                    type: 'GET',
                    data: {
                        'building': buildingId
                    },
                    dataType: 'json',
                    success: function(data) {
                        console.log('Received data:', data);
                        var floorSelect = django.jQuery('#id_floor_name');
                        floorSelect.empty();
                        floorSelect.append(django.jQuery('<option>').val('').text('---------'));
                        
                        django.jQuery.each(data, function(i, item) {
                            floorSelect.append(django.jQuery('<option>').val(item.id).text(item.floor_name));
                        });
                    },
                    error: function(xhr, errmsg, err) {
                        console.error('Error fetching floors:', errmsg);
                    }
                });
            }
        }

        // Bind change event
        django.jQuery('#id_building').on('change', function() {
            console.log('Building changed');
            loadFloors();
        });

        // Initial load if building is pre-selected
        if (django.jQuery('#id_building').val()) {
            console.log('Initial load triggered');
            loadFloors();
        }
    });
})(django);