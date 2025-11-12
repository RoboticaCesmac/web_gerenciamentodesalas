django.jQuery(document).ready(function($) {
    const isRecurring = $('#id_is_recurring');
    const fieldsetSingle = $('.reservation-single').parent();
    const fieldsetRecurring = $('.reservation-recurring').parent();

    function toggleRecurringFields() {
        if (isRecurring.is(':checked')) {
            fieldsetSingle.hide();
            fieldsetRecurring.show();
        } else {
            fieldsetSingle.show();
            fieldsetRecurring.hide();
        }
    }

    isRecurring.on('change', toggleRecurringFields);
    toggleRecurringFields();
});