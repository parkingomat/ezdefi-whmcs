jQuery(function($) {
    var selectors = {
        apiKeyInput: 'input[name="field[apiKey]"]',
        amountIdCheckbox: 'input[name="field[amountId]"]',
        ezdefiWalletCheckbox: 'input[name="field[ezdefiWallet]"]',
    };

    var whmcs_ezdefi_admin = function() {
        this.ezdefiData = JSON.parse($('#ezdefi-data').text());
        this.unpaid_invoices = this.ezdefiData.unpaid_invoices;
        this.configUrl = this.ezdefiData.config_url;
        this.adminUrl = this.ezdefiData.admin_url;
        this.systemUrl = this.ezdefiData.system_url;

        var init = this.init.bind(this);

        init();
    };

    whmcs_ezdefi_admin.prototype.init = function() {
        var self = this;

        this.addCurrencyTable.call(this);
        this.addManageExceptionBtn.call(this);

        self.table = $('#ezdefi-currency-table');
        self.form = self.table.closest('form');

        var currency = self.ezdefiData.gateway_params.token;

        if(currency === '') {
            self.addDefaultCurrency();
        } else {
            self.renderCurrency.call(this, currency)
        }

        self.form.find(selectors.apiKeyInput).attr('autocomplete', 'off');

        self.customValidationRule.call(this);
        self.initValidation();
        self.initSort.call(this);

        self.table.find('select').each(function() {
           self.initCurrencySelect($(this));
        });

        var addCurrency = this.addCurrency.bind(this);
        var removeCurrency = this.removeCurrency.bind(this);
        var toggleEdit = this.toggleEdit.bind(this);
        var saveCurrency = self.saveCurrency.bind(this);
        var toggleAmountSetting = this.toggleAmountSetting.bind(this);
        var onChangeDecimal = this.onChangeDecimal.bind(this);
        var onBlurDecimal = this.onBlurDecimal.bind(this);
        var onChangeApiKey = this.onChangeApiKey.bind(this);

        self.toggleAmountSetting(this);

        $(self.form)
            .on('click', '.addBtn', addCurrency)
            .on('click', '.editBtn', toggleEdit)
            .on('click', '.cancelBtn', toggleEdit)
            .on('click', '.deleteBtn', removeCurrency)
            .on('click', '.saveBtn', saveCurrency)
            .on('change', selectors.amountIdCheckbox, toggleAmountSetting)
            .on('focus', '.currency-decimal', onChangeDecimal)
            .on('blur', '.currency-decimal', onBlurDecimal)
            .on('keyup', selectors.apiKeyInput, onChangeApiKey);
    };

    whmcs_ezdefi_admin.prototype.addManageExceptionBtn = function() {
        var settingsTable = $('#Payment-Gateway-Config-ezdefi');

        var exceptionRow = $("<tr><td class='fieldlabel'>Manage Exceptions</td><td class='fieldarea'></td></tr>");
        settingsTable.find('tr:last').before(exceptionRow);

        var btn = $("<a href='' class='openModalBtn'><img src='"+ this.adminUrl +"images/icons/browser.png' alt=''> Open Exception Table</a>");
        btn.appendTo(exceptionRow.find('.fieldarea'));
    };

    whmcs_ezdefi_admin.prototype.addCurrencyTable = function() {
        var settingsTable = $('#Payment-Gateway-Config-ezdefi');

        var currencySettingRow = $("<tr><td class='fieldlabel'>Accepted Currency</td><td class='fieldarea'></td></tr>");
        settingsTable.find('tr:last').before(currencySettingRow);

        var table = $("<table id='ezdefi-currency-table'></table>")
        table.appendTo(currencySettingRow.find('.fieldarea'));

        var tableHead = $(
            "<thead>" +
            "<tr><th></th><th></th><th>Currency</th><th>Discount</th><th>Expiration</th><th>Wallet Address</th><th>Block Confirmation</th><th>Decimal</th><th></th></tr>" +
            "</thead>"
        );
        tableHead.appendTo(table);

        var tableBody = $("<tbody></tbody>");
        tableBody.appendTo(table);

        var tableFoot = $(
            "<tfoot><tr><td colspan='6'><a href='' class='saveBtn'><img src='"+ this.adminUrl +"images/icons/save.png' alt=''> Save currency</a> <a href='' class='addBtn'><img src='"+ this.adminUrl +"images/icons/add.png' alt=''> Add currency</a></td></tr></tfoot>"
        );
        tableFoot.appendTo(table);
    };

    whmcs_ezdefi_admin.prototype.addDefaultCurrency = function() {
        var rows = $(
            "<tr class='editing'>" +
                "<td class='sortable-handle'><span><i class='fas fa-align-justify'></i></span></td>" +
                "<td class='logo'>" +
                    "<img src='" + this.systemUrl + "/modules/gateways/ezdefi/images/newsd-icon.png' class='ezdefi-currency-logo'>" +
                "</td>" +
                "<td class='name'>" +
                    "<input class='currency-symbol' type='hidden' name='currency[0][symbol]' value='newsd'>" +
                    "<input class='currency-name' type='hidden' name='currency[0][name]' value='NewSD'>" +
                    "<input class='currency-desc' type='hidden' name='currency[0][desc]' value='NewSD - Stablecoin token for payment'>" +
                    "<input class='currency-logo' type='hidden' name='currency[0][logo]' value='" + this.systemUrl + "/modules/gateways/ezdefi/images/newsd-icon.png'>" +
                    "<div class='view'><span>NewSD</span></div>" +
                    "<div class='edit'><select name='currency[0][id]' class='select-select2'>" +
                        "<option value='newsd' selected='selected'>NewSD</option>" +
                    "</select></div>" +
                "</td>" +
                "<td class='discount'><div class='view'>0</div><div class='edit'><input type='number' name='currency[0][discount]' value='0' /> %</div></td>" +
                "<td class='lifetime'><div class='view'>15m</div><div class='edit'><input type='number' name='currency[0][lifetime]' value='15' /> m</div></td>" +
                "<td class='wallet'><div class='view'></div><div class='edit'><input type='text' name='currency[0][wallet]' /></div></td>" +
                "<td class='block_confirm'><div class='view'>1</div><div class='edit'><input type='number' name='currency[0][block_confirm]' value='1' /></div></td>" +
                "<td class='decimal'><div class='view'>4</div><div class='edit'><input type='number' name='currency[0][decimal]' class='currency-decimal' value='4' /><input type='hidden' class='currency-decimal-max' name='currency[0][decimal_max]' value='6'></div></td>" +
                "<td class='actions'>" +
                    "<div class='view'><a class='editBtn' href=''><img src='"+ this.adminUrl +"images/edit.gif' alt=''></a> <a class='deleteBtn' href=''><img src='"+ this.adminUrl +"images/icons/delete.png' alt=''></a></div>" +
                    "<div class='edit'><a class='cancelBtn' href=''>Cancel</a></div>" +
                "</td>" +
            "</tr>" +
            "<tr class='editing'>" +
                "<td class='sortable-handle'><span><i class='fas fa-align-justify'></i></span></td>" +
                "<td class='logo'>" +
                    "<img src='" + this.systemUrl + "/modules/gateways/ezdefi/images/bitcoin-icon.png' class='ezdefi-currency-logo'>" +
                "</td>" +
                "<td class='name'>" +
                    "<input class='currency-symbol' type='hidden' name='currency[1][symbol]' value='btc'>" +
                    "<input class='currency-name' type='hidden' name='currency[1][name]' value='Bitcoin'>" +
                    "<input class='currency-desc' type='hidden' name='currency[1][desc]' value=''>" +
                    "<input class='currency-logo' type='hidden' name='currency[1][logo]' value='" + this.systemUrl + "/modules/gateways/ezdefi/images/bitcoin-icon.png'>" +
                    "<div class='view'><span>Bitcoin</span></div>" +
                    "<div class='edit'><select name='currency[1][id]' class='select-select2'>" +
                    "<option value='btc' selected='selected'>Bitcoin</option>" +
                    "</select></div>" +
                "</td>" +
                "<td class='discount'><div class='view'>0</div><div class='edit'><input type='number' name='currency[1][discount]' value='0' /> %</div></td>" +
                "<td class='lifetime'><div class='view'>15m</div><div class='edit'><input type='number' name='currency[1][lifetime]' value='15' /> m</div></td>" +
                "<td class='wallet'><div class='view'></div><div class='edit'><input type='text' name='currency[1][wallet]' /></div></td>" +
                "<td class='block_confirm'><div class='view'>1</div><div class='edit'><input type='number' name='currency[1][block_confirm]' value='1' /></div></td>" +
                "<td class='decimal'><div class='view'>8</div><div class='edit'><input type='number' name='currency[1][decimal]' class='currency-decimal' value='8' /><input type='hidden' class='currency-decimal-max' name='currency[1][decimal_max]' value='8'></div></td>" +
                "<td class='actions'>" +
                    "<div class='view'><a class='editBtn' href=''><img src='"+ this.adminUrl +"images/edit.gif' alt=''></a> <a class='deleteBtn' href=''><img src='"+ this.adminUrl +"images/icons/delete.png' alt=''></a></div>" +
                    "<div class='edit'><a class='cancelBtn' href=''>Cancel</a></div>" +
                "</td>" +
            "</tr>" +
            "<tr class='editing'>" +
                "<td class='sortable-handle'><span><i class='fas fa-align-justify'></i></span></td>" +
                "<td class='logo'>" +
                    "<img src='" + this.systemUrl + "/modules/gateways/ezdefi/images/ethereum-icon.png' class='ezdefi-currency-logo'>" +
                "</td>" +
                "<td class='name'>" +
                    "<input class='currency-symbol' type='hidden' name='currency[2][symbol]' value='eth'>" +
                    "<input class='currency-name' type='hidden' name='currency[2][name]' value='Ethereum'>" +
                    "<input class='currency-desc' type='hidden' name='currency[2][desc]' value=''>" +
                    "<input class='currency-logo' type='hidden' name='currency[2][logo]' value='" + this.systemUrl + "/modules/gateways/ezdefi/images/ethereum-icon.png'>" +
                    "<div class='view'><span>Ethereum</span></div>" +
                    "<div class='edit'><select name='currency[2][id]' class='select-select2'>" +
                        "<option value='eth' selected='selected'>Ethereum</option>" +
                    "</select></div>" +
                "</td>" +
                "<td class='discount'><div class='view'>0</div><div class='edit'><input type='number' name='currency[2][discount]' value='0' /> %</div></td>" +
                "<td class='lifetime'><div class='view'>15m</div><div class='edit'><input type='number' name='currency[2][lifetime]' value='15' /> m</div></td>" +
                "<td class='wallet'><div class='view'></div><div class='edit'><input type='text' name='currency[2][wallet]' /></div></td>" +
                "<td class='block_confirm'><div class='view'>1</div><div class='edit'><input type='number' name='currency[2][block_confirm]' value='1' /></div></td>" +
                "<td class='decimal'><div class='view'>8</div><div class='edit'><input type='number' name='currency[2][decimal]' class='currency-decimal' value='8' /><input type='hidden' class='currency-decimal-max' name='currency[2][decimal_max]' value='18'></div></td>" +
                "<td class='actions'>" +
                    "<div class='view'><a class='editBtn' href=''><img src='"+ this.adminUrl +"images/edit.gif' alt=''></a> <a class='deleteBtn' href=''><img src='"+ this.adminUrl +"images/icons/delete.png' alt=''></a></div>" +
                    "<div class='edit'><a class='cancelBtn' href=''>Cancel</a></div>" +
                "</td>" +
            "</tr>"
        );
        rows.appendTo(this.table.find('tbody'));
    };

    whmcs_ezdefi_admin.prototype.renderCurrency = function(currency) {
        var rows = '';
        for (var i = 0; i < currency.length; i++) {
            var config = currency[i];
            var row =
                "<tr data-saved='1'>" +
                    "<td class='sortable-handle'><span><i class='fas fa-align-justify'></i></span></td>" +
                    "<td class='logo'>" +
                        "<img src='"+config['logo']+"' class='ezdefi-currency-logo'>" +
                    "</td>" +
                    "<td class='name'>" +
                        "<input class='currency-symbol' type='hidden' name='currency["+i+"][symbol]' value='"+config['symbol']+"'>" +
                        "<input class='currency-name' type='hidden' name='currency["+i+"][name]' value='"+config['name']+"'>" +
                        "<input class='currency-desc' type='hidden' name='currency["+i+"][desc]' value='"+config['desc']+"'>" +
                        "<input class='currency-logo' type='hidden' name='currency["+i+"][logo]' value='"+config['logo']+"'>" +
                        "<div class='view'><span>"+config['name']+"</span></div>" +
                        "<div class='edit'><select name='currency["+i+"][id]' class='select-select2'>" +
                            "<option value='"+config['symbol']+"' selected='selected'>"+config['symbol']+"</option>" +
                        "</select></div>" +
                    "</td>" +
                    "<td class='discount'><div class='view'><span>"+config['discount']+"%</span></div><div class='edit'><input type='number' name='currency["+i+"][discount]' value='"+config['discount']+"' /> %</div></td>" +
                    "<td class='lifetime'><div class='view'><span>"+(config['lifetime'] / 60)+"m</span></div><div class='edit'><input type='number' name='currency["+i+"][lifetime]' value='"+(config['lifetime']/60)+"' /> m</div></td>" +
                    "<td class='wallet'><div class='view'><span>"+config['wallet']+"</span></div><div class='edit'><input type='text' name='currency["+i+"][wallet]' value='"+config['wallet']+"' /></div></td>" +
                    "<td class='block_confirm'><div class='view'><span>"+config['block_confirm']+"</span></div><div class='edit'><input type='number' name='currency["+i+"][block_confirm]' value='"+config['block_confirm']+"' /></div></td>" +
                    "<td class='decimal'><div class='view'><span>"+config['decimal']+"</span></div><div class='edit'><input type='number' name='currency["+i+"][decimal]' value='"+config['decimal']+"' class='currency-decimal' /><input type='hidden' name='currency["+i+"][decimal_max]' value='"+config['decimal_max']+"' class='currency-decimal-max' /></div></td>" +
                    "<td class='actions'>" +
                    "<div class='view'><a class='editBtn' href=''><img src='"+ this.adminUrl +"images/edit.gif' alt=''></a> <a class='deleteBtn' href=''><img src='"+ this.adminUrl +"images/icons/delete.png' alt=''></a></div>" +
                    "<div class='edit'><a class='cancelBtn' href=''>Cancel</a></div>" +
                    "</td>" +
                "</tr>";
            rows += row;
        }
        $(rows).appendTo(this.table.find('tbody'));
    };

    whmcs_ezdefi_admin.prototype.customValidationRule = function() {
        jQuery.validator.addMethod('paymentMethodRequired', function(value, element) {
            var amount_id_checked = $(selectors.amountIdCheckbox).is(':checked');
            var ezdefi_wallet_checked = $(selectors.ezdefiWalletCheckbox).is(':checked');
            return amount_id_checked || ezdefi_wallet_checked;
        }, 'Please select at least one payment method');
        jQuery.validator.addMethod('greaterThanZero', function(value, element) {
            return parseFloat(value) > 0;
        }, 'Please enter a value greater than 0');
    };

    whmcs_ezdefi_admin.prototype.initValidation = function() {
        var self = this;

        this.form.validate({
            ignore: [],
            errorElement: 'span',
            errorClass: 'error',
            errorPlacement: function(error, element) {
                if(element.hasClass('select-select2')) {
                    error.insertAfter(element.closest('.edit').find('.select2-container'));
                } else {
                    if (element.closest('td').find('span.error').length > 0) {
                        element.closest('td').find('span.error').remove();
                    }
                    error.appendTo(element.closest('td'));
                }
            },
            highlight: function(element) {
                $(element).closest('td').addClass('form-invalid');
            },
            unhighlight: function(element) {
                $(element).closest('td').removeClass('form-invalid');
            },
            rules: {
                'field[apiUrl]': {
                    required: true,
                    url: true
                },
                'field[apiKey]': {
                    required: true
                },
                'field[amountId]': {
                    paymentMethodRequired: true
                },
                'field[ezdefiWallet]': {
                    paymentMethodRequired: true
                }
            }
        });

        this.table.find('tbody tr').each(function() {
            var row = $(this);
            self.addValidationRule(row);
        });
    };

    whmcs_ezdefi_admin.prototype.initSort = function() {
        var self = this;
        this.table.find('tbody').sortable({
            handle: '.sortable-handle span',
            stop: function() {
                $(this).find('tr').each(function (rowIndex) {
                    var row = $(this);
                    self.updateAttr(row, rowIndex);
                    row.find(".currency-decimal").rules("remove", "max");
                    row.find(".currency-decimal").rules("add", {
                        max: parseInt(row.find('.currency-decimal-max').val()),
                        messages: {
                            max: jQuery.validator.format("Max: {0}")
                        }
                    });
                    row.find(".currency-decimal").valid();
                });
                $(this).find('tr .saveBtn').trigger('click');
            }
        });
    };

    whmcs_ezdefi_admin.prototype.addValidationRule = function(row) {
        var self = this;
        row.find('input, select').each(function() {
            var name = $(this).attr('name');

            if(name.indexOf('discount') > 0) {
                $('input[name="'+name+'"]').rules('add', {
                    min: 0,
                    max: 100,
                    messages: {
                        min: jQuery.validator.format("Min: {0}"),
                        max: jQuery.validator.format("Max: {0}")
                    }
                });
            }

            if(name.indexOf('name') > 0) {
                var $select = $('select[name="'+name+'"]');
                $select.rules('add', {
                    required: {
                        depends: function(element) {
                            return self.form.find('input[name="field[apiUrl]"]').val() !== '';
                        },
                    },
                    messages: {
                        required: 'Please select currency'
                    }
                });
                $select.on('select2:close', function () {
                    $(this).valid();
                });
            }

            if(name.indexOf('wallet') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    required: true,
                    messages: {
                        required: 'Please enter wallet address'
                    }
                });
            }

            if(name.indexOf('block_confirm') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    min: 0,
                    messages: {
                        min: jQuery.validator.format("Min: {0}")
                    }
                });
            }

            if(name.indexOf('decimal') > 0 && name.indexOf("decimal_max") < 0) {
                var $input = $('input[name="'+name+'"]');
                var decimal_max = parseInt($input.parent().find(".currency-decimal-max").val());
                $input.rules('add', {
                    required: true,
                    min: 2,
                    max: decimal_max,
                    messages: {
                        min: jQuery.validator.format("Min: {0}"),
                        max: jQuery.validator.format("Max: {0}"),
                        required: "Required"
                    }
                });
            }

            if(name.indexOf('lifetime') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    digits: {
                        depends: function(element) {
                            return ($input.val().length > 0);
                        }
                    },
                    min: 0,
                    messages: {
                        min: jQuery.validator.format("Min: {0}")
                    }
                });
            }
        });
    };

    whmcs_ezdefi_admin.prototype.toggleAmountSetting = function() {
        var checked = this.form.find(selectors.amountIdCheckbox).is(':checked');
        var variation_setting = this.form.find('input[name*="variation"]').closest('tr');
        if(checked) {
            variation_setting.show();
            this.form.find('input[name*="variation"]').rules('add', {
                required: true,
                greaterThanZero: true,
                max: 100
            });
        } else {
            variation_setting.hide();
            this.form.find('input[name*="variation"]').rules('remove', 'required greaterThanZero max');
        }
    };

    whmcs_ezdefi_admin.prototype.onChangeDecimal = function(e) {
        var input = $(e.target);
        if(input.val().length > 0 && input.closest("tr").attr("data-saved") == "1") {
            var td = $(e.target).closest('td');
            if (td.find("span.error").length === 0) {
                td.find('.edit').append('<span class="error">Changing decimal can cause to payment interruption</span>');
            }
        }
    };

    whmcs_ezdefi_admin.prototype.onBlurDecimal = function(e) {
        var td = $(e.target).closest('td');
        td.find('.edit').find('.decimal-warning').remove();
    };

    whmcs_ezdefi_admin.prototype.initCurrencySelect = function(element) {
        var self = this;
        element.select2({
            width: '100%',
            ajax: {
                url: self.configUrl,
                type: 'POST',
                data: function(params) {
                    var query = {
                        action: 'get_token',
                        api_url: self.form.find('input[name="field[apiUrl]"]').val(),
                        api_key: self.form.find('input[name="field[apiKey]"]').val(),
                        keyword: params.term
                    };

                    return query;
                },
                processResults: function(data) {
                    data = JSON.parse(data);
                    return {
                        results: data.data
                    }
                },
                cache: true,
                dataType: 'json',
                delay: 250
            },
            placeholder: 'Select currency',
            minimumInputLength: 1,
            templateResult: self.formatCurrencyOption,
            templateSelection: self.formatCurrencySelection
        });
        element.on('select2:select', self.onSelect2Select);
    };

    whmcs_ezdefi_admin.prototype.formatCurrencyOption = function(currency) {
        if(currency.loading) {
            return currency.text;
        }

        var excludes = [];

        $('#ezdefi-currency-table').find('tbody tr').each(function() {
            var symbol = $(this).find('.currency-symbol').val();
            if(symbol && symbol.length > 0) {
                excludes.push(symbol);
            }
        });

        if(excludes.includes(currency.symbol)) {
            return;
        }

        var $container = $(
            "<div class='select2-currency'>" +
            "<div class='select2-currency__icon'><img src='" + currency.logo + "' /></div>" +
            "<div class='select2-currency__name'>" + currency.name + "</div>" +
            "</div>"
        );

        return $container;
    };

    whmcs_ezdefi_admin.prototype.formatCurrencySelection = function(currency) {
        return currency.name || currency.text ;
    };

    whmcs_ezdefi_admin.prototype.addCurrency = function(e) {
        e.preventDefault();

        var $row = this.table.find('tbody tr:last');
        var $clone = $row.clone();
        var count = this.table.find('tbody tr').length;
        var selectName = $clone.find('select').attr('name')
        var $select = $('<select name="'+selectName+'" class="select-select2"></select>');

        $clone.attr('data-saved', '0');
        $clone.find('select, .select2-container').remove();
        $clone.find('.logo img').attr('src', '');
        $clone.find('.name .view span').empty();
        $clone.find('.name .edit').prepend($select);
        $clone.find('input').each(function() {
            var input = $(this);
            var td = input.closest('td');
            if(!td.hasClass('name')) {
                td.find('.view').empty();
            }
            if(input.is('input[name*="discount"]')) {
                td.find('.view').text(0);
                input.val(0);
            } else if(input.is('input[name*="lifetime"]')) {
                td.find('.view').text(15);
                input.val(15);
            } else if(input.is('input[name*="block_confirm"]')) {
                td.find('.view').text(1);
                input.val(1);
            } else {
                input.val('');
            }
        });
        $clone.find('td').each(function() {
            $(this).find('span.error').remove();
        });
        this.updateAttr($clone, count);
        this.removeAttr($clone);
        $clone.insertAfter($row);
        this.initCurrencySelect($select);
        this.addValidationRule($clone);
        $clone.addClass('editing');
        return false;
    };

    whmcs_ezdefi_admin.prototype.removeCurrency = function(e) {
        e.preventDefault();

        var self = this;

        if(self.table.find('tbody tr').length === 1) {
            alert('You must select at least 1 accepted currency');
            return false;
        }

        if(confirm('Do you want to delete this row')) {
            $(e.target).closest('tr').remove();
            self.table.find('tr').each(function (rowIndex) {
                $(this).find('.select2-container').remove();
                var $select = $(this).find('.select-select2');
                self.initCurrencySelect($select);

                if($(this).hasClass('editing')) {
                    var name = $(this).find('.currency-name').val();
                    $(this).find('.select2-selection__rendered').attr('title', name);
                    $(this).find('.select2-selection__rendered').text(name);
                }

                var row = $(this);
                var number = rowIndex - 1;
                self.updateAttr(row, number);
            });
            self.table.find('tbody tr .saveBtn').trigger('click');
        }
        return false;
    };

    whmcs_ezdefi_admin.prototype.toggleEdit = function(e) {
        e.preventDefault();

        var self = this;
        var $row = $(e.target).closest('tr');

        if($row.find('.currency-symbol').val() === '') {
            self.removeCurrency(e);
        } else {
            $row.toggleClass('editing');
        }
    };

    whmcs_ezdefi_admin.prototype.saveCurrency = function(e) {
        e.preventDefault();

        var self = this;
        var data = {};

        if(!self.form.valid()) {
            return;
        }

        self.table.find('tbody tr').each(function() {
            $(this).removeClass('editing');
            $(this).closest('tr').find('input, select').each(function () {
                var name = $(this).attr('name');
                var value = $(this).val();
                data[name] = value;
                if(($(this).is('input[name*="discount"]') && !$(this).is('input[name*="discount_max"]')) || $(this).is('input[name*="lifetime"]') || $(this).is('input[name*="wallet"]') || $(this).is('input[name*="block_confirm"]') || $(this).is('input[name*="decimal"]')) {
                    var td = $(this).closest('td');
                    if(td.is('.discount')) {
                        td.find('.view').text(value + '%');
                    } else if(td.is('.lifetime')) {
                        td.find('.view').text(value + 'm');
                    } else {
                        td.find('.view').text(value);
                    }
                }
            });
        });

        data['action'] = 'save_currency';

        $.ajax({
            url: this.configUrl,
            method: 'post',
            data: data,
            beforeSend: function() {
                self.table.closest('td').block({ message: null });
            },
            error: function() {
                self.table.closest('td').block({message: 'Can not save currency config. Please try again'});
            },
            success:function(response) {
                self.table.closest('td').unblock();
                self.table.find('tbody input').each(function() {
                    var value = $(this).val();
                    var td = $(this).closest('td');
                    if(!td.hasClass('name')) {
                        if(td.is('.discount')) {
                            td.find('.view').text(value + '%');
                        } else if(td.is('.lifetime')) {
                            td.find('.view').text(value + 'm');
                        } else {
                            td.find('.view').text(value);
                        }
                    }
                });
            }
        })
    };

    whmcs_ezdefi_admin.prototype.onSelect2Select = function(e) {
        var td = $(e.target).closest('td');
        var tr = $(e.target).closest('tr');
        var data = e.params.data;
        td.find('.currency-symbol').val(data.symbol);
        td.find('.currency-name').val(data.name);
        td.find('.currency-logo').val(data.logo);
        if(data.description) {
            td.find('.currency-desc').val(data.description);
        } else {
            td.find('.currency-desc').val('');
        }
        tr.find('.logo img').attr('src', data.logo);
        tr.find('.currency-decimal').val(data.suggestedDecimal);
        tr.find('.currency-decimal').closest('td').find('.view').text(data.suggestedDecimal);
        tr.find('.currency-decimal').rules('remove', 'max');
        tr.find('.currency-decimal-max').val(data.decimal);
        tr.find('.currency-decimal').rules('add', {
            max: data.decimal,
            messages: {
                max: jQuery.validator.format("Max: {0}")
            }
        });
        tr.find('.currency-decimal').valid();
        tr.find('.currency-decimal').closest('td').find('.view').text(data.suggestedDecimal);
        td.find('.view span').text(data.name);
    };

    whmcs_ezdefi_admin.prototype.updateAttr = function(row, number) {
        row.find('input, select').each(function () {
            var name = $(this).attr('name');
            name = name.replace(/\[(\d+)\]/, '[' + parseInt(number) + ']');
            $(this).attr('name', name).attr('id', name);
        });
    };

    whmcs_ezdefi_admin.prototype.removeAttr = function(row) {
        row.find('input, select').each(function () {
            $(this).removeAttr('aria-describedby').removeAttr('aria-invalid');
        });
    };

    whmcs_ezdefi_admin.prototype.onChangeApiKey = function(e) {
        var self = this;
        var $input = $(e.target);
        $input.rules('add', {
            remote: {
                url: self.configUrl,
                type: 'POST',
                data: {
                    action: 'check_api_key',
                    api_url: function() {
                        return self.form.find('input[name="field[apiUrl]"]').val();
                    },
                    api_key: function() {
                        return self.form.find('input[name="field[apiKey]"]').val();
                    }
                },
                beforeSend: function() {
                    self.form.find(selectors.apiKeyInput).addClass('pending');
                },
                complete: function (data) {
                    self.form.find(selectors.apiKeyInput).removeClass('pending');
                    var response = data.responseText;
                    var $inputWrapper = self.form.find(selectors.apiKeyInput).closest('td');
                    if (response === 'true') {
                        $inputWrapper.append('<span class="correct">Correct</span>');
                        window.setTimeout(function () {
                            $inputWrapper.find('.correct').remove();
                        }, 1000);
                    }
                }
            },
            messages: {
                remote: "API Key is not correct. Please check again"
            }
        });
    };

    new whmcs_ezdefi_admin();
});