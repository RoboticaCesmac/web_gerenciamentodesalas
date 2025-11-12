django.jQuery(document).ready(function($) {
    console.log('Reservation admin JS loaded');

    const isRecurring = $('#id_is_recurring');
    
    const dayFields = {
        'seg': { start: '#id_monday_start', end: '#id_monday_end', label: 'Segunda-feira' },
        'ter': { start: '#id_tuesday_start', end: '#id_tuesday_end', label: 'Terça-feira' },
        'qua': { start: '#id_wednesday_start', end: '#id_wednesday_end', label: 'Quarta-feira' },
        'qui': { start: '#id_thursday_start', end: '#id_thursday_end', label: 'Quinta-feira' },
        'sex': { start: '#id_friday_start', end: '#id_friday_end', label: 'Sexta-feira' },
        'sab': { start: '#id_saturday_start', end: '#id_saturday_end', label: 'Sábado' },
        'dom': { start: '#id_sunday_start', end: '#id_sunday_end', label: 'Domingo' }
    };

    function hideAllDayFields() {
        Object.values(dayFields).forEach(field => {
            $(field.start).closest('.fieldWrapper').hide();
            $(field.end).closest('.fieldWrapper').hide();
        });
    }

    function toggleRecurringFields() {
        if (isRecurring.is(':checked')) {
            // Esconde os checkboxes de dias da semana
            $('#id_recurring_days').closest('.fieldWrapper').hide();
            
            // Esconde todos os campos de horário
            hideAllDayFields();
        } else {
            hideAllDayFields();
        }
    }

    // Event listeners
    isRecurring.on('change', toggleRecurringFields);
    
    // Setup inicial
    setTimeout(() => {
        console.log('Setup inicial');
        toggleRecurringFields();
    }, 100);
});
