
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Integration Documents</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
    <div class="d-flex" style="min-height:100vh">
        <%- include('./partials/sidebar.ejs') %>

        <main class="flex-fill p-4">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="text-primary font-weight-bold mb-0">
                        Integration Documents
                    </h3>
                    <a href="/upload" class="btn btn-primary">＋ Add Integration</a>
                </div>

                <% if(message){ %>
                    <div class="alert alert-success"><%= message %></div>
                <% } %>

                <% if(errorMessage){ %>
                    <div class="alert alert-danger"><%= errorMessage %></div>
                <% } %>

                <div class="card border-0 shadow-sm">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="thead-light">
                                <tr>
                                    <th>No</th>
                                    <th>Partner</th>
                                    <th>API Name</th>
                                    <th>VA Type</th>
                                    <th>Created</th>
                                    <th>Updated</th>
                                    <th class="text-center">Uploaded</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <% if(!integrations.length){ %>
                                    <tr>
                                        <td colspan="8" class="text-center text-muted py-5">
                                            Belum ada data integrasi.
                                        </td>
                                    </tr>
                                <% } %>

                                <% integrations.forEach((item, i) => { %>
                                    <tr>
                                        <td><%= i + 1 %></td>
                                        <td class="font-weight-bold"><%= item.name %></td>
                                        <td><%= item.api_name %></td>
                                        <td><%= item.va_type || '-' %></td>
                                        <td>
                                            <%= item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-' %>
                                        </td>
                                        <td>
                                            <%= item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-' %>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">
                                                <%= item.uploaded_count %>
                                            </span>
                                        </td>
                                        <td class="text-nowrap">
                                            <a href="/read_data?id=<%= item.id %>"
                                               class="btn btn-sm btn-outline-primary">
                                                View
                                            </a>

                                            <button type="button"
                                                    class="btn btn-sm btn-outline-danger"
                                                    data-toggle="modal"
                                                    data-target="#deleteModal"
                                                    data-id="<%= item.id %>"
                                                    data-name="<%= item.name %>">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                <% }) %>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title font-weight-bold">Konfirmasi Hapus</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    Apakah Anda yakin ingin menghapus integrasi
                    <strong id="deleteName"></strong> beserta seluruh dokumennya?
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-dismiss="modal">
                        Batal
                    </button>
                    <a href="#" id="confirmDelete" class="btn btn-danger">
                        Ya, Hapus
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        $('#deleteModal').on('show.bs.modal', function (event) {
            const button = $(event.relatedTarget);
            const id = button.data('id');
            const name = button.data('name');

            $('#deleteName').text(name);
            $('#confirmDelete').attr('href', '/delete?id=' + encodeURIComponent(id));
        });
    </script>
</body>
</html>








<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Detail Integrasi</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">
    <div class="d-flex" style="min-height:100vh">
        <%- include('./partials/sidebar.ejs') %>

        <main class="flex-fill p-4">
            <div class="container-fluid" style="max-width:1100px">
                <a href="/" class="font-weight-bold">‹ Back</a>

                <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                    <h3 class="text-primary font-weight-bold mb-0">
                        Detail Integrasi
                    </h3>
                    <a class="btn btn-primary"
                       href="/update_data?id=<%= integration.id %>">
                        Edit
                    </a>
                </div>

                <% if(message){ %>
                    <div class="alert alert-success"><%= message %></div>
                <% } %>

                <% if(errorMessage){ %>
                    <div class="alert alert-danger"><%= errorMessage %></div>
                <% } %>

                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <small class="text-muted">Mitra / Institusi</small>
                                <div class="font-weight-bold"><%= integration.name %></div>
                            </div>

                            <div class="col-md-4">
                                <small class="text-muted">API Name</small>
                                <div class="font-weight-bold"><%= integration.api_name %></div>
                            </div>

                            <div class="col-md-4">
                                <small class="text-muted">VA Type</small>
                                <div class="font-weight-bold"><%= integration.va_type || '-' %></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white font-weight-bold">
                        Dokumen Terunggah (<%= documents.length %>)
                    </div>

                    <div class="card-body">
                        <% if(!documents.length){ %>
                            <div class="text-muted text-center py-4">
                                Belum ada dokumen.
                            </div>
                        <% } %>

                        <% documents.forEach(doc => { %>
                            <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom py-3">
                                <div class="pr-3">
                                    <div class="font-weight-bold">
                                        <%= doc.document_name %>
                                    </div>

                                    <small class="text-muted">
                                        <%= doc.original_filename %> ·
                                        <%= (Number(doc.file_size) / 1024 / 1024).toFixed(2) %> MB
                                    </small>
                                </div>

                                <a class="btn btn-sm btn-outline-primary"
                                   href="/view_file?documentId=<%= doc.id %>">
                                    Lihat / Unduh
                                </a>
                            </div>
                        <% }) %>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>
</html>







<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Edit Integrasi</title>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">

    <style>
        .dropzone {
            border: 2px dashed #9bb8df;
            border-radius: 10px;
            background: #f7faff;
            padding: 25px;
            text-align: center;
            cursor: pointer;
        }

        .dropzone.drag {
            background: #eaf2ff;
        }

        .doc-row {
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            padding: 12px;
            margin-bottom: 10px;
        }
    </style>
</head>

<body class="bg-light">
    <div class="d-flex" style="min-height:100vh">
        <%- include('./partials/sidebar.ejs') %>

        <main class="flex-fill p-4">
            <div class="container-fluid" style="max-width:1100px">
                <a href="/read_data?id=<%= integration.id %>" class="font-weight-bold">
                    ‹ Kembali
                </a>

                <h3 class="text-primary font-weight-bold mt-3 mb-4">
                    Edit Integrasi
                </h3>

                <% if(message){ %>
                    <div class="alert alert-success"><%= message %></div>
                <% } %>

                <% if(errorMessage){ %>
                    <div class="alert alert-danger"><%= errorMessage %></div>
                <% } %>

                <form id="editForm"
                      action="/update_data?id=<%= integration.id %>"
                      method="POST"
                      enctype="multipart/form-data">

                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <div class="form-row">
                                <div class="form-group col-md-4">
                                    <label>Nama Mitra</label>
                                    <input class="form-control"
                                           name="institutionName"
                                           maxlength="256"
                                           value="<%= integration.name %>"
                                           required>
                                </div>

                                <div class="form-group col-md-4">
                                    <label>API Name</label>
                                    <input class="form-control"
                                           name="integrationType"
                                           maxlength="128"
                                           value="<%= integration.api_name %>"
                                           required>
                                </div>

                                <div class="form-group col-md-4">
                                    <label>VA Type</label>
                                    <input class="form-control"
                                           name="vaType"
                                           maxlength="64"
                                           value="<%= integration.va_type || '' %>">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-header bg-white font-weight-bold">
                            Dokumen Saat Ini
                        </div>

                        <div class="card-body">
                            <% if(!documents.length){ %>
                                <p class="text-muted">Belum ada dokumen.</p>
                            <% } %>

                            <% documents.forEach(doc => { %>
                                <div class="doc-row">
                                    <div class="d-flex align-items-start">
                                        <div class="flex-fill pr-3">
                                            <div class="font-weight-bold">
                                                <%= doc.document_name %>
                                            </div>

                                            <div class="small text-muted">
                                                <%= doc.original_filename %>
                                            </div>

                                            <a class="small"
                                               href="/view_file?documentId=<%= doc.id %>"
                                               target="_blank">
                                                Lihat dokumen
                                            </a>

                                            <div class="mt-2">
                                                <label class="small mb-1">
                                                    Ganti file (opsional)
                                                </label>

                                                <input type="file"
                                                       class="form-control-file replacement-file"
                                                       name="replacementFiles"
                                                       data-id="<%= doc.id %>"
                                                       accept=".pdf,.doc,.docx,.xls,.xlsx">

                                                <input type="hidden"
                                                       name="replacementDocumentIds"
                                                       value="<%= doc.id %>"
                                                       disabled>
                                            </div>
                                        </div>

                                        <label class="text-danger small">
                                            <input type="checkbox"
                                                   name="deleteDocumentIds"
                                                   value="<%= doc.id %>"
                                                   class="delete-doc">
                                            Hapus
                                        </label>
                                    </div>
                                </div>
                            <% }) %>
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white font-weight-bold">
                            Tambah Dokumen Baru
                        </div>

                        <div class="card-body">
                            <div class="dropzone" id="dropzone">
                                <strong>Tarik file ke sini atau klik untuk memilih</strong>

                                <div class="small text-muted mt-1">
                                    Maks. <%= maxMB %> MB/file,
                                    <%= maxTotalMB %> MB total,
                                    <%= maxFiles %> file.
                                </div>

                                <input type="file"
                                       id="newInput"
                                       multiple
                                       accept=".pdf,.doc,.docx,.xls,.xlsx"
                                       hidden>
                            </div>

                            <div id="newList" class="mt-3"></div>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end mt-4">
                        <a href="/read_data?id=<%= integration.id %>"
                           class="btn btn-light mr-2">
                            Batal
                        </a>

                        <button class="btn btn-primary" id="saveBtn">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <script>
        (() => {
            const form = document.getElementById('editForm');
            const input = document.getElementById('newInput');
            const drop = document.getElementById('dropzone');
            const list = document.getElementById('newList');
            const save = document.getElementById('saveBtn');

            const maxFile = <%= maxMB * 1024 * 1024 %>;
            const maxTotal = <%= maxTotalMB * 1024 * 1024 %>;
            const maxFiles = <%= maxFiles %>;

            const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
            let added = [];

            const fmt = n => (n / 1024 / 1024).toFixed(2) + ' MB';

            function nameOf(f) {
                return f.name
                    .replace(/\.[^.]+$/, '')
                    .replace(/[_-]+/g, ' ')
                    .trim();
            }

            function render() {
                list.innerHTML = '';

                added.forEach((x, i) => {
                    const row = document.createElement('div');
                    row.className = 'doc-row';

                    row.innerHTML =
                        '<label class="small font-weight-bold">Nama dokumen</label>' +
                        '<div class="d-flex">' +
                        '<input class="form-control form-control-sm mr-2" maxlength="255">' +
                        '<button type="button" class="btn btn-sm btn-outline-danger">Hapus</button>' +
                        '</div>' +
                        '<div class="small text-muted mt-1"></div>';

                    row.querySelector('input').value = x.name;

                    row.querySelector('input').oninput = e => {
                        x.name = e.target.value;
                    };

                    row.querySelector('.small.text-muted').textContent =
                        x.file.name + ' · ' + fmt(x.file.size);

                    row.querySelector('button').onclick = () => {
                        added.splice(i, 1);
                        render();
                    };

                    list.appendChild(row);
                });
            }

            function add(files) {
                for (const f of Array.from(files || [])) {
                    const ext = f.name.split('.').pop().toLowerCase();

                    if (!allowed.includes(ext)) {
                        alert('Format file tidak didukung: ' + f.name);
                        continue;
                    }

                    if (f.size > maxFile) {
                        alert('Ukuran file terlalu besar: ' + f.name);
                        continue;
                    }

                    if (added.length >= maxFiles) {
                        alert('Maksimal ' + maxFiles + ' file.');
                        break;
                    }

                    const currentTotal = added.reduce(
                        (s, x) => s + x.file.size, 0
                    );

                    if (currentTotal + f.size > maxTotal) {
                        alert('Total ukuran file melebihi batas.');
                        break;
                    }

                    added.push({
                        file: f,
                        name: nameOf(f)
                    });
                }

                input.value = '';
                render();
            }

            drop.onclick = () => input.click();
            input.onchange = () => add(input.files);

            ['dragover', 'dragenter'].forEach(event => {
                drop.addEventListener(event, e => {
                    e.preventDefault();
                    drop.classList.add('drag');
                });
            });

            ['dragleave', 'drop'].forEach(event => {
                drop.addEventListener(event, e => {
                    e.preventDefault();
                    drop.classList.remove('drag');
                });
            });

            drop.addEventListener('drop', e => {
                add(e.dataTransfer.files);
            });

            document.querySelectorAll('.replacement-file').forEach(inp => {
                const hidden = inp.parentElement.querySelector('input[type=hidden]');

                inp.addEventListener('change', () => {
                    hidden.disabled = !inp.files.length;
                });
            });

            form.addEventListener('submit', e => {
                const replacements = Array.from(
                    document.querySelectorAll('.replacement-file')
                ).filter(x => x.files.length);

                const deletes = Array.from(
                    document.querySelectorAll('.delete-doc:checked')
                ).map(x => x.value);

                if (replacements.some(x => deletes.includes(x.dataset.id))) {
                    e.preventDefault();
                    alert('Dokumen yang sama tidak bisa dihapus dan diganti sekaligus.');
                    return;
                }

                if (replacements.length + added.length > maxFiles) {
                    e.preventDefault();
                    alert('Maksimal ' + maxFiles + ' file perubahan per proses.');
                    return;
                }

                if (added.some(x => !x.name.trim())) {
                    e.preventDefault();
                    alert('Nama dokumen baru tidak boleh kosong.');
                    return;
                }

                const total =
                    added.reduce((s, x) => s + x.file.size, 0) +
                    replacements.reduce((s, x) => s + x.files[0].size, 0);

                if (
                    total > maxTotal ||
                    replacements.some(x => x.files[0].size > maxFile)
                ) {
                    e.preventDefault();
                    alert('Batas ukuran file terlampaui.');
                    return;
                }

                const data = new FormData(form);

                data.delete('newDocuments');
                data.delete('newDocumentNames');

                added.forEach(x => {
                    data.append('newDocuments', x.file, x.file.name);
                    data.append('newDocumentNames', x.name);
                });

                e.preventDefault();

                save.disabled = true;
                save.textContent = 'Menyimpan...';

                fetch(form.action, {
                    method: 'POST',
                    body: data,
                    redirect: 'follow'
                })
                .then(r => {
                    if (r.redirected) {
                        location.href = r.url;
                    } else {
                        return r.text().then(t => {
                            throw new Error(t || 'Gagal menyimpan');
                        });
                    }
                })
                .catch(err => {
                    alert(err.message);
                    save.disabled = false;
                    save.textContent = 'Simpan Perubahan';
                });
            });
        })();
    </script>
</body>
</html>

