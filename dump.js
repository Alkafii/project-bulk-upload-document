<style>
    #reviewModal .modal-content {
        border: 0;
        border-radius: 16px;
        overflow: hidden;
        /* Mengunci tinggi total modal agar seragam di semua halaman */
        height: 680px;
        display: flex;
        flex-direction: column;
    }

    #reviewModal .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #edf0f4;
        flex-shrink: 0;
    }

    #reviewModal .modal-body {
        padding: 22px 24px;
        display: flex;
        flex-direction: column;
        /* Mengambil porsi utama di tengah secara dinamis */
        flex-grow: 1;
        overflow: hidden; 
    }

    #reviewModal .review-info {
        background: #f8faff;
        border: 1px solid #e8eef8;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 16px;
        flex-shrink: 0;
    }

    #reviewModal .review-info-label {
        color: #718096;
        font-size: 12px;
        margin-bottom: 4px;
    }

    #reviewModal .review-info-value {
        color: #26364a;
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    #reviewModal .review-stat {
        background: #f8faff;
        border: 1px solid #e8eef8;
        border-radius: 10px;
        padding: 12px 15px;
        height: 100%;
    }

    #reviewModal .review-stat-label {
        color: #718096;
        font-size: 12px;
        margin-bottom: 4px;
    }

    #reviewModal .review-stat-value {
        color: #2563eb;
        font-size: 19px;
        font-weight: 700;
    }

    /* Wadah daftar dokumen berbasis Flex */
    #reviewModal .review-list-wrapper {
        border: 1px solid #e5eaf1;
        border-radius: 10px;
        /* flex-grow memaksa box mengambil ruang sisa yang tersedia di dalam modal body */
        flex-grow: 1;
        /* overflow-y mengaktifkan scroll internal hanya pada daftar dokumen */
        overflow-y: auto;
        background: #fff;
        margin-bottom: 0;
    }

    #reviewModal .review-list {
        margin-bottom: 0;
    }

    #reviewModal .review-item {
        display: flex;
        align-items: flex-start;
        padding: 12px 15px;
        border-bottom: 1px solid #edf0f4;
        background: #fff;
    }

    #reviewModal .review-item:last-child {
        border-bottom: 0;
    }

    #reviewModal .review-number {
        width: 27px;
        height: 27px;
        min-width: 27px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        background: #edf4ff;
        color: #2563eb;
        font-size: 12px;
        font-weight: 700;
        margin-right: 12px;
    }

    #reviewModal .review-document-name {
        font-size: 14px;
        font-weight: 700;
        color: #26364a;
        overflow-wrap: anywhere;
    }

    #reviewModal .review-file-name {
        font-size: 12px;
        color: #718096;
        overflow-wrap: anywhere;
        margin-top: 3px;
    }

    #reviewModal .review-item-meta {
        font-size: 11px;
        color: #718096;
        margin-top: 5px;
    }

    #reviewModal .review-type {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 20px;
        background: #edf4ff;
        color: #2563eb;
        white-space: nowrap;
    }

    #reviewModal .review-type.replacement {
        background: #fff5e8;
        color: #b7791f;
    }

    #reviewModal .review-pagination {
        padding-top: 14px;
        padding-bottom: 2px;
        flex-shrink: 0;
    }

    #reviewModal .modal-footer {
        padding: 15px 24px;
        border-top: 1px solid #edf0f4;
        flex-shrink: 0;
        background: #fff;
    }

    @media (max-width: 576px) {
        #reviewModal .modal-dialog {
            margin: 10px;
        }

        #reviewModal .modal-content {
            height: auto;
            max-height: 90vh;
        }

        #reviewModal .modal-header {
            padding: 16px;
        }

        #reviewModal .modal-body {
            padding: 16px;
        }

        #reviewModal .modal-footer {
            padding: 12px 16px;
        }

        #reviewModal .review-item {
            padding: 11px;
        }

        #reviewModal .review-type {
            margin-top: 7px;
        }
    }
</style>

<div class="modal fade" id="reviewModal"
     tabindex="-1" role="dialog"
     aria-labelledby="reviewModalLabel"
     aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content shadow-lg">

            <div class="modal-header">
                <div>
                    <h5 class="modal-title font-weight-bold text-primary mb-1"
                        id="reviewModalLabel">
                        Upload Confirmation
                    </h5>

                    <small class="text-muted">
                        Review the document before saving changes.
                    </small>
                </div>

                <button type="button" class="close"
                        data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">

                <div class="review-info">
                    <div class="row">
                        <div class="col-md-6 mb-3 mb-md-0">
                            <div class="review-info-label">Partner Name</div>
                            <div class="review-info-value" id="reviewPartner">-</div>
                        </div>

                        <div class="col-md-6">
                            <div class="review-info-label">API Name</div>
                            <div class="review-info-value" id="reviewApi">-</div>
                        </div>
                    </div>
                </div>

                <div class="row mb-3 flex-shrink-0">
                    <div class="col-6">
                        <div class="review-stat">
                            <div class="review-stat-label">Total Document</div>
                            <div class="review-stat-value">
                                <span id="reviewDocCount">0</span>
                                <small style="font-size: 12px; color: #718096;">
                                    file
                                </small>
                            </div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="review-stat">
                            <div class="review-stat-label">Total Size</div>
                            <div class="review-stat-value" id="reviewSize">
                                0 MB
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
                    <h6 class="font-weight-bold mb-0">
                        Document List
                    </h6>

                    <small class="text-muted" id="reviewPageInfo"></small>
                </div>

                <div class="review-list-wrapper">
                    <ul class="list-unstyled review-list" id="reviewDocList">
                    </ul>
                </div>

                <nav class="review-pagination" id="reviewPaginationContainer">
                    <ul class="pagination pagination-sm justify-content-center mb-0"
                        id="reviewPaginationControls">
                    </ul>
                </nav>

            </div>

            <div class="modal-footer">
                <button type="button"
                        class="btn btn-light font-weight-bold text-secondary"
                        data-dismiss="modal">
                    Cancel
                </button>

                <button type="button"
                        id="confirmSubmitBtn"
                        class="btn btn-primary font-weight-bold px-4">
                    Upload
                </button>
            </div>

        </div>
    </div>
</div>
