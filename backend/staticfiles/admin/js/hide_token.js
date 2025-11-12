document.addEventListener('DOMContentLoaded', function() {
    // Esconder Token da lista de apps no admin
    const appList = document.querySelector('#content');
    if (appList) {
        const tokenLinks = appList.querySelectorAll('a[href*="authtoken"]');
        tokenLinks.forEach(link => {
            let parent = link.closest('tr') || link.closest('div[class*="app"]');
            if (parent) {
                parent.style.display = 'none';
            }
        });
    }

    // Esconder linha de Token na tabela
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach(row => {
        if (row.textContent.toLowerCase().includes('token') && row.textContent.toLowerCase().includes('authtoken')) {
            row.style.display = 'none';
        }
    });

    // Se estiver na página de Token, redirecionar
    if (window.location.href.includes('/admin/authtoken/')) {
        window.location.href = '/admin/';
    }
});