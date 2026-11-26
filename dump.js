<% documents.forEach((doc, index) => { %>
    <div class="main-doc-item d-flex flex-wrap justify-content-between align-items-start <%= index !== documents.length - 1 ? 'border-bottom pb-3 mb-3' : '' %>">
        <div class="d-flex pr-3">
            <div class="font-weight-bold text-muted mr-3" style="min-width: 25px;">
                <%= index + 1 %>.
            </div>

            <div>
                <div class="font-weight-bold">
                    <%= doc.document_name %>
                </div>

                <small class="text-muted">
                    <%= doc.original_filename %>
                    ·
                    <%= (Number(doc.file_size) / 1024 / 1024).toFixed(2) %> MB
                </small>
            </div>
        </div>

        <div class="pt-1">
            <a class="btn btn-sm btn-outline-primary"
               href="/view_file?documentId=<%= doc.id %>">
                View
            </a>
        </div>
    </div>
<% }) %>

<nav class="mt-4" aria-label="Document pagination">
    <ul class="pagination pagination-sm justify-content-center mb-0"
        id="documentPaginationControls">
    </ul>
</nav>




<script>
    (() => {
        "use strict";

        let currentPage = 1;

        const itemsPerPage = 10;
        const docItems = document.querySelectorAll(".main-doc-item");
        const paginationControls = document.getElementById("documentPaginationControls");

        function renderPagination() {
            const totalItems = docItems.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            paginationControls.innerHTML = "";

            if (totalItems === 0) return;

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            // Sembunyikan seluruh dokumen terlebih dahulu
            docItems.forEach(item => {
                item.style.display = "none";
            });

            // Tampilkan maksimal 10 dokumen sesuai halaman
            Array.from(docItems)
                .slice(startIndex, endIndex)
                .forEach(item => {
                    item.style.display = "";
                });

            // Tidak perlu pagination jika hanya ada satu halaman
            if (totalPages <= 1) return;

            function createPageButton(label, targetPage, disabled = false, active = false) {
                const li = document.createElement("li");

                li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;

                const link = document.createElement("a");
                link.className = "page-link";
                link.href = "#";
                link.innerHTML = label;

                link.addEventListener("click", function (e) {
                    e.preventDefault();

                    if (disabled) return;

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

            // Tombol Previous
            paginationControls.appendChild(
                createPageButton(
                    "&laquo;",
                    currentPage - 1,
                    currentPage === 1
                )
            );

            // Nomor halaman
            for (let i = 1; i <= totalPages; i++) {
                paginationControls.appendChild(
                    createPageButton(
                        i,
                        i,
                        false,
                        currentPage === i
                    )
                );
            }

            // Tombol Next
            paginationControls.appendChild(
                createPageButton(
                    "&raquo;",
                    currentPage + 1,
                    currentPage === totalPages
                )
            );
        }

        // Jalankan pagination saat halaman pertama kali dibuka
        renderPagination();

    })();
</script>
