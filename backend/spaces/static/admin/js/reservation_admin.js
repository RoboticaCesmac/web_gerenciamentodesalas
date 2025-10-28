django.jQuery(document).ready(function($) {
    const isRecurring = $('#id_is_recurring');
    const recurringFields = $('.field-recurring_days, .field-recurring_start_date, .field-recurring_end_date');
    const dateField = $('.field-date');

    function toggleRecurringFields() {
        if (isRecurring.is(':checked')) {
            recurringFields.show();
            dateField.hide();
        } else {
            recurringFields.hide();
            dateField.show();
        }
    }

    isRecurring.on('change', toggleRecurringFields);
    toggleRecurringFields(); // Execute on page load
});
