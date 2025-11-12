django.jQuery(document).ready(function($) {
    console.log('Reservation admin JS loaded'); // Debug line

    const isRecurring = $('#id_is_recurring');
    const singleFields = $('.field-date, .field-start_time, .field-end_time');
    const recurringFields = $('.field-recurring_days, .field-recurring_start_date, .field-recurring_end_date');
    const dayFields = {
        '0': $('.field-monday_start, .field-monday_end'),
        '1': $('.field-tuesday_start, .field-tuesday_end'),
        '2': $('.field-wednesday_start, .field-wednesday_end'),
        '3': $('.field-thursday_start, .field-thursday_end'),
        '4': $('.field-friday_start, .field-friday_end'),
        '5': $('.field-saturday_start, .field-saturday_end'),
        '6': $('.field-sunday_start, .field-sunday_end')
    };

    // Esconde todos os campos de horário inicialmente
    Object.values(dayFields).forEach(fields => fields.hide());

    function toggleRecurringFields() {
        if (isRecurring.is(':checked')) {
            singleFields.hide();
            recurringFields.show();
            updateDayFields();
        } else {
            singleFields.show();
            recurringFields.hide();
            Object.values(dayFields).forEach(fields => fields.hide());
        }
    }

    function updateDayFields() {
        // Esconde todos os campos primeiro
        Object.values(dayFields).forEach(fields => fields.hide());
        
        // Mostra apenas os campos dos dias selecionados
        $('#id_recurring_days input:checked').each(function() {
            const day = $(this).val();
            dayFields[day].show();
        });
    }

    // Event listeners
    isRecurring.on('change', toggleRecurringFields);
    $('#id_recurring_days input').on('change', updateDayFields);
    
    // Setup inicial
    toggleRecurringFields();
});
