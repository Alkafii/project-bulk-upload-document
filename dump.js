
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Add Document Name</title>

    <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css">

    <link rel="stylesheet" href="/style/style.css">

    <style>
        .page-title {
            font-weight: 700;
            color: #2563eb;
        }

        .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #334155;
        }

        .document-card {
            border: 0;
            border-radius: 10px;
        }

        .document-table th {
            background: #2563eb;
            color: white;
            font-size: 13px;
            vertical-align: middle;
        }

        .document-table td {
            font-size: 14px;
            vertical-align: middle;
        }

        .form-label {
            font-weight: 600;
            font-size: 14px;
        }

        .required {
            color: #dc3545;
        }

        @media (max-width: 576px) {
            .page-content {
                padding: 16px 10px;
            }

            .card-body {
                padding: 16px;
            }
        }
    </style>
</head>

<body>
    <div class="app-layout">

        <%- include('./partials/sidebar.ejs') %>

        <main class="app-content page-content">

            <div class="container-fluid px-0">

                <!-- Page Header -->
                <div class="mb-4">
                    <h3 class="page-title text-uppercase mb-2">
                        Add Document Name
                    </h3>

                    <p class="text-muted mb-0">
                        Kelola daftar nama dokumen yang diperlukan
                        dalam proses integrasi API.
                    </p>
                </div>

                <!-- Form Add Document -->
                <div class="card document-card shadow-sm mb-4">

                    <div class="card-body p-4">

                        <h6 class="section-title mb-3">
                            <span class="mr-2">＋</span>
                            Add New Document
                        </h6>

                        <hr>

                        <form id="documentForm">

                            <div class="form-group mb-4">

                                <label class="form-label">
                                    Document Category
                                    <span class="required">*</span>
                                </label>

                                <select
                                    class="form-control"
                                    id="documentCategory"
                                    name="category"
                                    required>

                                    <option value="" selected disabled>
                                        Select document category
                                    </option>

                                    <option value="Integration">
                                        Integration
                                    </option>

                                    <option value="ASPI">
                                        ASPI
                                    </option>

                                    <option value="VA SNAP Off Us">
                                        VA SNAP Off Us
                                    </option>

                                    <option value="VA SNAP On Us">
                                        VA SNAP On Us
                                    </option>

                                    <option value="QRIS MPM SNAP">
                                        QRIS MPM SNAP
                                    </option>

                                    <option value="Functionality">
                                        Functionality
                                    </option>

                                </select>

                                <small class="form-text text-muted">
                                    Pilih kategori tempat dokumen akan ditambahkan.
                                </small>

                            </div>

                            <div class="form-group mb-4">

                                <label class="form-label">
                                    Document Name
                                    <span class="required">*</span>
                                </label>

                                <input
                                    type="text"
                                    class="form-control"
                                    id="documentName"
                                    name="documentName"
                                    placeholder="Example: Form Pendaftaran API"
                                    maxlength="150"
                                    required>

                                <small class="form-text text-muted">
                                    Masukkan nama dokumen yang akan digunakan
                                    sebagai identitas field upload.
                                </small>

                            </div>

                            <div class="d-flex justify-content-end">

                                <button
                                    type="reset"
                                    class="btn btn-light text-secondary mr-2">
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    disabled
                                    title="Menunggu implementasi backend">
                                    Save Document Name
                                </button>

                            </div>

                        </form>

                    </div>
                </div>

                <!-- Existing Document List -->
                <div class="card document-card shadow-sm">

                    <div class="card-body p-4">

                        <div class="d-flex justify-content-between
                            align-items-center mb-3">

                            <h6 class="section-title mb-0">
                                Registered Documents
                            </h6>

                            <span class="badge badge-primary">
                                Document Management
                            </span>

                        </div>

                        <hr>

                        <div class="table-responsive">

                            <table class="table table-bordered
                                table-hover document-table mb-0">

                                <thead>
                                    <tr>
                                        <th width="7%" class="text-center">
                                            No
                                        </th>

                                        <th width="30%">
                                            Category
                                        </th>

                                        <th>
                                            Document Name
                                        </th>

                                        <th width="15%" class="text-center">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    <% if (typeof documentGroups !== 'undefined'
                                        && documentGroups.length > 0) { %>

                                        <% let number = 1; %>

                                        <% documentGroups.forEach(group => { %>

                                            <% group.documents.forEach(document => { %>

                                                <tr>
                                                    <td class="text-center">
                                                        <%= number++ %>
                                                    </td>

                                                    <td>
                                                        <%= group.name %>
                                                    </td>

                                                    <td>
                                                        <%= document.name %>
                                                    </td>

                                                    <td class="text-center">
                                                        <button
                                                            type="button"
                                                            class="btn btn-sm btn-outline-secondary"
                                                            disabled>
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            class="btn btn-sm btn-outline-danger"
                                                            disabled>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>

                                            <% }) %>

                                        <% }) %>

                                    <% } else { %>

                                        <tr>
                                            <td colspan="4"
                                                class="text-center text-muted py-4">
                                                Document list will appear here.
                                            </td>
                                        </tr>

                                    <% } %>

                                </tbody>

                            </table>

                        </div>

                    </div>
                </div>

            </div>

        </main>

    </div>
</body>
</html>

<li>
    <a href="/document-names" class="sidebar-link">
        <span class="sidebar-link-icon">▤</span>
        <span>Document Names</span>
    </a>
</li>


