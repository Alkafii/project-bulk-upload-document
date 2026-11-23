
<div class="form-row mb-3">

    <% documents.forEach((doc, index) => { %>

        <div class="form-group col-md-6 mb-3 <%= index % 2 === 0 ? 'pr-3' : 'pl-3' %>">

            <label for="<%= doc.id %>">
                <%= doc.label %>
            </label>

            <div class="custom-file">

                <input
                    type="file"
                    class="custom-file-input"
                    name="<%= doc.name %>"
                    id="<%= doc.id %>"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                >

                <label
                    class="custom-file-label text-truncate"
                    for="<%= doc.id %>"
                    data-browse="🗀"
                    style="padding-right: 50px;"
                >
                    Choose file
                </label>

            </div>

            <small class="form-text text-muted">
                File formats: PDF, DOCX, XLSX.
            </small>

        </div>

    <% }) %>

</div>

