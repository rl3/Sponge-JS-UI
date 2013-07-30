

var showModal = function ( $dialog ) {
    var $currentModals = $('.modal.in');
    if ($currentModals.length > 0) { // if we have active modals
        $currentModals.one('hidden', function () { 
            // when they've finished hiding
            $dialog.modal('show');
            $dialog.one('hidden', function () {
                // when we close the dialog
                $currentModals.modal('show');

            });
        }).modal('hide');
    }
    else { // otherwise just simply show the modal
        $dialog.modal('show');
    }
};

DataObjectTools.showModal= showModal;
