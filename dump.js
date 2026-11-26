.main-doc-item.pagination-hidden {
    display: none !important;
}

<script>
    (() => {
        "use strict";

        const ITEMS_PER_PAGE = 10;

        let currentPage = 1;

        const docItems = Array.from(
            document.querySelectorAll(".main-doc-item")
        );

        const paginationControls = document.getElementById(
            "documentPaginationControls"
        );

        function createPageButton(label, targetPage, disabled = false, active = false) {
            const li = document.createElement("li");

            li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;

            const link = document.createElement("a");
            link.className = "page-link";
            link.href = "#";
            link.innerHTML = label;

            link.addEventListener("click", function (e) {
                e.preventDefault();

                if (disabled || targetPage < 1) return;

                currentPage = targetPage;

                renderPagination();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });

            li.appendChild(link);

            return li;
        }

        function renderPagination() {
            const totalItems = docItems.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

            paginationControls.innerHTML = "";

            // Jika tidak ada dokumen
            if (totalItems === 0) return;

            // Pastikan halaman aktif tidak melebihi jumlah halaman
            currentPage = Math.min(Math.max(currentPage, 1), totalPages);

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;

            // Tampilkan hanya 10 dokumen pada halaman aktif
            docItems.forEach((item, index) => {
                const isVisible = index >= startIndex && index < endIndex;

                item.classList.toggle(
                    "pagination-hidden",
                    !isVisible
                );
            });

            // Tidak menampilkan navigasi jika hanya satu halaman
            if (totalPages <= 1) return;

            // Previous
            paginationControls.appendChild(
                createPageButton(
                    "&laquo;",
                    currentPage - 1,
                    currentPage === 1
                )
            );

            // Nomor halaman
            for (let page = 1; page <= totalPages; page++) {
                paginationControls.appendChild(
                    createPageButton(
                        page,
                        page,
                        false,
                        currentPage === page
                    )
                );
            }

            // Next
            paginationControls.appendChild(
                createPageButton(
                    "&raquo;",
                    currentPage + 1,
                    currentPage === totalPages
                )
            );
        }

        // Inisialisasi
        renderPagination();

    })();
</script>
