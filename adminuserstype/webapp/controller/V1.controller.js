sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    'sap/ui/Device',
    'sap/ui/model/Sorter',
    'sap/m/MessageToast',
    'sap/ui/core/Fragment',
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
    "sap/ui/core/BusyIndicator"
],
    function (Controller, JSONModel, Filter, FilterOperator, MessageBox, Device, Sorter, MessageToast, Fragment, exportLibrary, Spreadsheet, BusyIndicator) {


        var EdmType = exportLibrary.EdmType;

        return Controller.extend("com.claro.proveedores.adminuserstype.controller.V1", {

            onInit: function () {
                this._mViewSettingsDialogs = {};
                this.getOwnerComponent().getRouter().getRoute("V1").attachPatternMatched(this._onObjectMatched, this);
                // sap.ui.getCore().getConfiguration().setLanguage("es");
            },

            _onObjectMatched: function () {
                this.i18n = this.getView().getModel("i18n").getResourceBundle();

                this.jsonDataUser = {
                    userName: "",
                    userCode: "",
                    userMail: ""
                };
                if (parent.sap.ushell !== undefined) {
                    var dataUser = parent.sap.ushell.Container.getUser();
                    var code = dataUser.getEmail() === undefined ? dataUser.getId() : dataUser.getEmail();
                    code = code.split("@")[0].toUpperCase();

                    this.jsonDataUser = {
                        userName: dataUser.getFullName(),
                        userCode: code,
                        userMail: dataUser.getEmail() === undefined ? "" : dataUser.getEmail()
                    };
                }
                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();

                var modelSettings = new JSONModel({
                    titluloTransaccion: this.i18n.getText("resultados", ["0"]),
                    enabledButtonTable: false
                });

                this.initArrayObjectView();

                this.getView().setModel(modelSettings, "oModelSettings");


                this.onSetView();
            },

            onSetView: function () {

                this.busyGlobal(true);
                this._instance();

                var settings = {
                    "url": this.geturl,
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "data": JSON.stringify({
                        "input": {

                        }
                    }),
                };
                var oModel = new JSONModel({
                    TITULO_TABLA: this.i18n.getText("resultados", ["0"]),
                    DATA: []
                });

                this.getView().setModel(oModel, "oModel");

                $.ajax(settings).done(function (response) {

                    var dataResponse = response;
                    oModel.setProperty("/DATA", dataResponse);
                    oModel.setProperty("/TITULO_TABLA", this.i18n.getText("resultados", [dataResponse.length.toString()]));
                    oModel.refresh();
                    this.busyGlobal(false);
                }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {

                    this.busyGlobal(false);
                }.bind(this));
            },

            handleSortButtonPressed: function () {
                this.getViewSettingsDialog("com.claro.proveedores.adminuserstype.view.fragments.dialogoSort")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();
                    });
            },

            handleFilterButtonPressed: function () {
                this.getViewSettingsDialog("com.claro.proveedores.adminuserstype.view.fragments.dialogoFilter")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();

                        var data = this.getView().byId("oTable").getModel("oModel").getData().DATA;

                        var model0 = new JSONModel(),
                            data0 = [],
                            model1 = new JSONModel(),
                            data1 = [],
                            model2 = new JSONModel(),
                            data2 = []


                        if (data.length > 0) {
                            for (var i in data) {
                                data1.push({
                                    key: data[i].DESCRIPTION
                                });
                                data2.push({
                                    key: data[i].DELETESTATUS,
                                    text: data[i].DELETESTATUS_DESCRIPTION
                                });

                            }
                            model0.setData([...new Map(data0.map(item => [item['key'], item])).values()]);
                            model1.setData([...new Map(data1.map(item => [item['key'], item])).values()]);
                            model2.setData([...new Map(data2.map(item => [item['key'], item])).values()]);

                        }
                        oViewSettingsDialog.setModel(model0, "oModelFilter0");
                        oViewSettingsDialog.setModel(model1, "oModelFilter1");
                        oViewSettingsDialog.setModel(model2, "oModelFilter2");


                    }.bind(this));

            },
            getViewSettingsDialog: function (sDialogFragmentName) {

                var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];
                if (!pDialog) {
                    pDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: sDialogFragmentName,
                        controller: this
                    }).then(function (oDialog) {
                        if (Device.system.desktop) {
                            oDialog.addStyleClass("sapUiSizeCompact");
                        }

                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                    this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
                }
                return pDialog;
            },
            handleSortDialogConfirm: function (oEvent) {

                var oTable = this.getView().byId("oTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    sPath,
                    sText,
                    bDescending,
                    aSorters = [];

                if (mParams.sortItem !== undefined) {
                    sPath = mParams.sortItem.getKey();
                    sText = mParams.sortItem.getText();
                    bDescending = mParams.sortDescending;
                    aSorters.push(new Sorter(sPath, bDescending));

                    oBinding.sort(aSorters);
                } else {
                    oBinding.sort([new Sorter("USERTYPEID", mParams.sortDescending)]);
                }

                var baseIcon = "sap-icon://slim-arrow-";
                oTable.getColumns().forEach(function (element) {
                    var items = element.getHeader().getItems();
                    var label = items[0];
                    if (items[1] !== undefined) {
                        var icon = items[1];
                    }
                    var iconText = "";
                    if (sText === label.getText()) {
                        var i = "up";
                        if (bDescending) {
                            i = "down";
                        }
                        iconText = baseIcon + i;
                    }
                    if (icon) {
                        icon.setSrc(iconText);
                    }
                }.bind(this));

            },
            handleFilterDialogConfirm: function (oEvent) {

                var oTable = this.getView().byId("oTable"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    aFilters = [],
                    arrayText = [];

                if (mParams.filterItems !== undefined) {
                    mParams.filterItems.forEach(function (oItem) {
                        var aText = oItem.getParent().getText(),
                            sPath = oItem.getParent().getKey(),
                            sOperator = "EQ",
                            sValue1 = oItem.getKey(),
                            oFilter = new Filter(sPath, sOperator, sValue1);
                        aFilters.push(oFilter);
                        arrayText.push(aText);
                    });

                    // apply filter settings
                    oBinding.filter(aFilters);
                }

                var baseIcon = "sap-icon://filter";

                oTable.getColumns().forEach(function (element) {

                    var items = element.getHeader().getItems();
                    var label = items[0];
                    if (items[2] !== undefined) {
                        var icon = items[2];
                    }
                    var iconText = "";
                    var filt = arrayText.filter(function (f) {
                        return f === label.getText();
                    }.bind(this));

                    if (filt.length > 0) {
                        iconText = baseIcon;
                    }

                    if (icon) {
                        icon.setSrc(iconText);
                    }


                }.bind(this));

            },
            onSearchTable: function (oEvent) {

                // add filter for search
                var aFilters = [];
                var filterFinal = [];
                var sQuery = oEvent.getSource().getValue();

                if (sQuery && sQuery.length > 0) {
                    var filter1 = new Filter({ path: "DESCRIPTION", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false });
                    aFilters.push(filter1);
                }
                if (aFilters.length > 0) {
                    filterFinal = new Filter({
                        filters: aFilters,
                        and: false
                    });
                }
                var oList = this.getView().byId("oTable");
                var oBinding = oList.getBinding("items");
                oBinding.filter(filterFinal, "Application");
            },

            _instance: function () {

                if (this.getView().getModel("oModel") !== undefined) {
                    this.oModel = this.getView().getModel("oModel");
                };
                if (this.getView().getModel("oModelSettings") !== undefined) {
                    this.oModelSettings = this.getView().getModel("oModelSettings");
                };
                this.i18n = this.getView().getModel("i18n").getResourceBundle();
                this.geturl = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/gUserstype');
                this.createurl = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/cUserstype');
                this.updateurl = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/uUserstype');
            },
            busyGlobal: function (cond) {
                if (cond) {
                    BusyIndicator.show(0);
                } else {
                    jQuery.sap.delayedCall(1500, this, function () {
                        BusyIndicator.hide();
                    }.bind(this));
                }
            },
            formattDateTime: function (fecha) {
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style: 'medium',
                    UTC: true,
                    pattern: 'dd/MM/YYYY HH:mm'
                });
                var dateFormatted = dateFormat.format(fecha);
                return dateFormatted;
            },
            getDateTime: function (fecha) {
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style: 'medium',
                    UTC: true,
                    pattern: 'yyyy-MM-dd'
                });
                var dateFormatted = dateFormat.format(fecha);
                var salida = dateFormatted + "T" + this.addZero(fecha.getHours()) + ":" + this.addZero(fecha.getMinutes());
                return salida;
            },
            addZero: function (sValue) {
                if (sValue < 10) {
                    sValue = "0" + sValue;
                }
                return sValue;
            },
            formaterRut: function (sValue) {
                var value = sValue.getParameters().value;
                var valueFormater = sValue.getParameters().value;
                var inputUser = sValue.getSource();
                // Despejar Puntos
                var valueReplace = value.split('.').join('');
                // Despejar Guión
                valueReplace = valueReplace.replace('-', '');

                // Aislar CuvalueReplaceerpo y Dígito Verificador
                var cuerpo = valueReplace.slice(0, -1);
                var dv = valueReplace.slice(-1).toUpperCase();

                // Formatear RUN
                valueFormater = cuerpo + '-' + dv;

                // Si no cumple con el mínimo ej. (n.nnn.nnn)
                if (cuerpo.length < 7) {
                    inputUser.setValueState("Error");
                    inputUser.setValueStateText(this.i18n.getText("rutIncompleto"));
                }

                // Calcular Dígito Verificador
                var suma = 0;
                var multiplo = 2;

                // Para cada dígito del Cuerpo
                for (var i = 1; i <= cuerpo.length; i++) {

                    // Obtener su Producto con el Múltiplo Correspondiente
                    var index = multiplo * valueReplace.charAt(cuerpo.length - i);

                    // Sumar al Contador General
                    suma = suma + index;

                    // Consolidar Múltiplo dentro del rango [2,7]
                    if (multiplo < 7) {
                        multiplo = multiplo + 1;
                    } else {
                        multiplo = 2;
                    }

                }

                // Calcular Dígito Verificador en base al Módulo 11
                var dvEsperado = 11 - (suma % 11);

                // Casos Especiales (0 y K)
                dv = (dv == 'K') ? 10 : dv;
                dv = (dv == 'k') ? 10 : dv;
                dv = (dv == 0) ? 11 : dv;

                // Validar que el Cuerpo coincide con su Dígito Verificador
                if (dvEsperado != dv) {
                    inputUser.setValueState("Error");
                    inputUser.setValueStateText(this.i18n.getText("rutInvalido"));
                } else {
                    if (value !== "-") {
                        inputUser.setValueState("None");
                        inputUser.setValueStateText("");
                    } else if (value === "-") {
                        inputUser.setValueState("Error");
                        inputUser.setValueStateText(this.i18n.getText("rutInvalido"));
                    }

                }

                // Si todo sale bien, eliminar errores (decretar que es válido)
                //rutCrear.setCustomValidity('');

                return valueFormater;
            },
            checkRut: function (sValue) {
                var valueFormater = sValue.getParameters().value;
                var valueReplace = valueFormater.split('.').join('');
                // Despejar Guión
                valueReplace = valueReplace.replace('-', '');
                // Aislar CuvalueReplaceerpo y Dígito Verificador
                var cuerpo = valueReplace.slice(0, -1);
                var dv = valueReplace.slice(-1).toUpperCase();
                valueFormater = cuerpo + '-' + dv;

                sValue.getSource().setValue(valueFormater);
                // Formatear RUN
                return valueFormater;

            },
            formatoCorreo: function (oEvent) {
                var value = oEvent.getSource().getValue();
                var inputUser = oEvent.getSource();
                var re = /^([\da-z_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;
                if (!re.exec(value)) {
                    inputUser.setValueState("Error");
                    inputUser.setValueStateText(this.i18n.getText("correoInvalido"));
                } else {
                    inputUser.setValueState("None");
                    inputUser.setValueStateText("");
                }
            },
            onDialogInsert: function () {

                this._dialogInsert = sap.ui.xmlfragment(
                    "com.claro.proveedores.adminuserstype.view.fragments.dialogoInsertar", this);

                this._dialogInsert.attachAfterClose(function () {
                    this._dialogInsert.destroy();
                }.bind(this));

                this.getView().addDependent(this._dialogInsert);
                this._dialogInsert.open();
                this._dialogInsert.setBusy(true);

                this._dialogInsert.setEscapeHandler(function () {
                    this._valueDialogNuevaTransaccion.open();
                }.bind(this));

                this._dialogInsert.setBusy(false);

            },
            dialogInsertarClose: function () {
                this._dialogInsert.destroy();
            },
            onDialogOk: function () {

                this.validateView(this.arrayObjectView, "").then(function (responseValidate) {

                    if (!responseValidate) {
                        this.onProcessOk();
                    } else {
                        MessageToast.show(this.i18n.getText("warning1"));
                        jQuery.sap.delayedCall(3000, this, function () {
                            this.setStateNone(this.arrayObjectView, "").then(function () {
                            }.bind(this));
                        }.bind(this));
                    }
                }.bind(this));
            },
            onProcessOk: function () {
                var inputUSERTYPEID = null;
                var inputDESCRIPTION = sap.ui.getCore().byId("inputDESCRIPTION").getValue();
                var inputDELETESTATUS = "1";
                var datum = new Date();
                var jsonData = {};
                jsonData.USERTYPEID = inputUSERTYPEID;
                jsonData.DESCRIPTION = inputDESCRIPTION;
                jsonData.DELETESTATUS = inputDELETESTATUS;

                MessageBox.information(this.i18n.getText("warning2"), {
                    title: this.i18n.getText("aviso"),
                    actions: [this.i18n.getText("si"), this.i18n.getText("no")],
                    emphasizedAction: this.i18n.getText("si"),
                    styleClass: "",
                    onClose: function (sAction) {

                        if (sAction === this.i18n.getText("si")) {

                            this.busyGlobal(true);
                            var settings = {
                                "url": this.createurl,
                                "method": "POST",
                                "headers": {
                                    "Content-Type": "application/json"
                                },
                                "data": JSON.stringify({
                                    "input": {
                                        "USERTYPEID": inputUSERTYPEID,
                                        "DESCRIPTION": inputDESCRIPTION,
                                        "DELETESTATUS": inputDELETESTATUS
                                    }
                                }),
                            };

                            $.ajax(settings).done(function (response) {
                                this.setLogSystem("Creación", response.message, response.data).then(function () {
                                    this.busyGlobal(false);
                                    MessageBox["success"](this.i18n.getText("ok1"), {
                                        title: this.i18n.getText("aviso"),
                                        actions: ["OK"],
                                        emphasizedAction: "OK",
                                        details: "",
                                        styleClass: "",
                                        onClose: function (sAction) {
                                            this.dialogInsertarClose();
                                            this.onSetView();
                                        }.bind(this)
                                    });
                                }.bind(this));
                            }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {

                                this.busyGlobal(false);
                                MessageBox.error(this.i18n.getText("error1"), {
                                    title: this.i18n.getText("aviso"),
                                    actions: ["OK"],
                                    emphasizedAction: "OK",
                                    details: JSON.stringify(errorThrown),
                                    styleClass: "",
                                    onClose: function (sAction) {
                                        this.dialogInsertarClose();
                                        this.onSetView();
                                    }.bind(this)
                                });
                            }.bind(this));


                        }
                    }.bind(this)
                });
            },
            onDialogOk2: function () {


                this.validateView(this.arrayObjectView, "Editar").then(function (responseValidate) {

                    if (!responseValidate) {
                        this.onProcessOk2();
                    } else {
                        MessageToast.show(this.i18n.getText("warning1"));
                        jQuery.sap.delayedCall(3000, this, function () {
                            this.setStateNone(this.arrayObjectView, "Editar").then(function () {
                            }.bind(this));
                        }.bind(this));
                    }
                }.bind(this));
            },
            onProcessOk2: function () {

                var editUSERTYPEID = this.selected.USERTYPEID;
                var editDESCRIPTION = sap.ui.getCore().byId("inputDESCRIPTIONEditar").getValue();
                var DELETESTATUS = sap.ui.getCore().byId("inputDELETESTATUS");
                var editDELETESTATUS = DELETESTATUS.getButtons()[0].getSelected() ? '1' : '0';
                var jsonData = {};
                jsonData.USERTYPEID = editUSERTYPEID;
                jsonData.DESCRIPTION = editDESCRIPTION;
                jsonData.DELETESTATUS = editDELETESTATUS;

                MessageBox.information(this.i18n.getText("warning3"), {
                    title: this.i18n.getText("aviso"),
                    actions: [this.i18n.getText("si"), this.i18n.getText("no")],
                    emphasizedAction: this.i18n.getText("si"),
                    styleClass: "",
                    onClose: function (sAction) {

                        if (sAction === this.i18n.getText("si")) {

                            this.busyGlobal(true);
                            var settings = {
                                "url": this.updateurl,
                                "method": "POST",
                                "headers": {
                                    "Content-Type": "application/json"
                                },
                                "data": JSON.stringify({
                                    "input": {
                                        "USERTYPEID": editUSERTYPEID,
                                        "DESCRIPTION": editDESCRIPTION,
                                        "DELETESTATUS": editDELETESTATUS
                                    }
                                }),
                            };

                            $.ajax(settings).done(function (response) {
                                this.setLogSystem("Actualización", response.message, response.data).then(function () {
                                    this.busyGlobal(false);
                                    MessageBox["success"](this.i18n.getText("ok3"), {
                                        title: this.i18n.getText("aviso"),
                                        actions: ["OK"],
                                        emphasizedAction: "OK",
                                        details: "",
                                        styleClass: "",
                                        onClose: function (sAction) {
                                            this.dialogModificarClose();
                                            this.onSetView();
                                        }.bind(this)
                                    });
                                }.bind(this));
                            }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {

                                this.busyGlobal(false);
                                MessageBox.error(this.i18n.getText("error2"), {
                                    title: this.i18n.getText("aviso"),
                                    actions: ["OK"],
                                    emphasizedAction: "OK",
                                    details: JSON.stringify(errorThrown),
                                    styleClass: "",
                                    onClose: function (sAction) {
                                        this.dialogModificarClose();
                                        this.onSetView();
                                    }.bind(this)
                                });
                            }.bind(this));

                        }
                    }.bind(this)
                });
            },
            setStateNone: function (fields, accion) {
                return new Promise(function (resolve) {
                    var ac = accion;
                    if (ac === undefined) {
                        ac = "";
                    }
                    var oCyclicFunction = function (item, l) {
                        if (item.length === l) {
                            resolve();
                        } else {
                            var camp = this.getView().byId(item[l].id + ac) || sap.ui.getCore().byId(item[l].id + ac);
                            if (camp !== undefined) {
                                if (item[l].required) {
                                    if (camp.getVisible()) {
                                        if (item[l].type === "ip" || item[l].type === "ipRut" || item[l].type === "ipMail" || item[l].type === "dt" || item[l].type === "sl" || item[l].type ===
                                            "cb" || item[l].type ===
                                            "stp") {
                                            camp.setValueState("None");
                                        }
                                        l++;
                                        oCyclicFunction(item, l);
                                    } else {
                                        l++;
                                        oCyclicFunction(item, l);
                                    }
                                } else {
                                    l++;
                                    oCyclicFunction(item, l);
                                }
                            } else {
                                l++;
                                oCyclicFunction(item, l);
                            }
                        }
                    }.bind(this);
                    oCyclicFunction(fields, 0);
                }.bind(this));
            },
            validateView: function (fields, action) {

                return new Promise(function (resolve) {

                    var ac = action;
                    if (ac === undefined || ac === "add") {
                        ac = "";
                    }

                    var error = false;
                    var oCyclicFunction = function (item, l) {
                        if (item.length === l) {
                            resolve(error);
                        } else {
                            var camp = this.getView().byId(item[l].id + ac) || sap.ui.getCore().byId(item[l].id + ac);

                            if (camp !== undefined) {


                                var value;
                                if (item[l].required) {
                                    if (camp.getVisible()) {
                                        if (item[l].type === "ip" || item[l].type === "dt") {
                                            value = camp.getValue().toString();
                                            if (value.trim().length === 0) {
                                                camp.setValueState("Error");
                                                error = true;
                                            }
                                        } else if (item[l].type === "sl" || item[l].type === "cb") {
                                            value = camp.getSelectedItem();
                                            if (value === null || value.getKey() === "" || value.getKey() === "Escoge una opción...") {
                                                camp.setValueState("Error");
                                                error = true;
                                            }
                                        } else if (item[l].type === "stp") {
                                            value = camp.getValue();
                                            if (value < 1) {
                                                camp.setValueState("Error");
                                                error = true;
                                            }
                                        } else if (item[l].type === "up") {
                                            value = camp.getItems();
                                            if (value === 0) {
                                                error = true;
                                            }
                                        } else if (item[l].type === "ipRut") {
                                            value = camp.getValue().toString().replace(/ \ s * /g, "");

                                            if (value.trim().length === 0 || value.trim() === "-" || camp.getValueState() === "Error" || camp.getValueStateText() === this.i18n.getText("correoRUT")) {
                                                camp.setValueState("Error");
                                                error = true;
                                            }
                                        } else if (item[l].type === "ipMail") {
                                            value = camp.getValue().toString();

                                            if (value.trim().length === 0 || camp.getValueState() === "Error" || camp.getValueStateText() === this.i18n.getText("correoInvalido")) {
                                                camp.setValueState("Error");
                                                error = true;
                                            }
                                        } else if (item[l].type === "sw") {
                                            value = camp;

                                        }
                                    } else {
                                        l++;
                                        oCyclicFunction(item, l);
                                    }
                                    l++;
                                    oCyclicFunction(item, l);
                                } else {
                                    l++;
                                    oCyclicFunction(item, l);
                                }
                            } else {
                                l++;
                                oCyclicFunction(item, l);
                            }
                        }
                    }.bind(this);

                    oCyclicFunction(fields, 0);

                }.bind(this));
            },

            onDialogModify: function (oEvent) {
                this._instance();
                var obj = oEvent.getSource().getBindingContext("oModel").getObject();
                this.selected = obj;
                var jsonEdit = {};

                for (var key in obj) {
                    jsonEdit[key] = obj[key];
                }

                var oModelEdit = new JSONModel(jsonEdit);
                this.getView().setModel(oModelEdit, "oModelEdit");

                this._dialogEdit = sap.ui.xmlfragment(
                    "com.claro.proveedores.adminuserstype.view.fragments.dialogoModificar", this);

                this._dialogEdit.attachAfterClose(function () {
                    this._dialogEdit.destroy();
                }.bind(this));

                this.getView().addDependent(this._dialogEdit);
                this._dialogEdit.open();
                this._dialogEdit.setBusy(true);

                this._dialogEdit.setEscapeHandler(function () {
                    this._dialogEdit.open();
                }.bind(this));

                this._dialogEdit.setBusy(false);

            },
            dialogModificarClose: function () {
                this._dialogEdit.destroy();
            },
            onDescargaExcel: function () {
                var aCols, oBinding, oSettings, oSheet, oTable;

                oTable = this.getView().byId('oTable');
                oBinding = oTable.getBinding('items').oList;
                aCols = this.createColumnConfig();
                oSettings = {
                    workbook: { columns: aCols },
                    fileName: 'userstype.xlsx',
                    dataSource: oBinding
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().then(function () {
                    MessageToast.show(this.i18n.getText("ok2"));
                }).finally(function () {
                    oSheet.destroy();
                });
            },
            createColumnConfig: function () {


                var id = this.i18n.getText("USERTYPEID"),
                    description = this.i18n.getText("description"),
                    estado = this.i18n.getText("estado");

                return [
                    {
                        label: description,
                        property: 'DESCRIPTION',
                        type: EdmType.String
                    },
                    {
                        label: estado,
                        property: 'DELETESTATUS_DESCRIPTION',
                        type: EdmType.String
                    }
                ];
            },
            initArrayObjectView: function () {

                this.arrayObjectView = [
                    {
                        id: "inputDESCRIPTION",
                        required: true,
                        type: "ip"
                    },
                    {
                        id: "inputDELETESTATUS",
                        required: false,
                        type: "ip"
                    }

                ];
                return;
            },

            setLogSystem: function (action, description, detail) {
                return new Promise(function (resolve) {
                    let mail = this.jsonDataUser.userMail;
                    let jsonData = {};

                    let uuid = self.crypto.randomUUID();
                    jsonData.ID = uuid; // Type="Edm.Guid" Nullable="false"/>
                    jsonData.creation_date = this.getDateTime(new Date()); // Type="Edm.DateTimeOffset"/>
                    jsonData.action = action; // Type="Edm.String" MaxLength="100"/>
                    jsonData.location = "Mantenedores"; // Type="Edm.String" MaxLength="50"/>
                    jsonData.description = description; // Type="Edm.String" MaxLength="999"/>
                    jsonData.creation_user = mail; // Type="Edm.String" MaxLength="255"/>
                    jsonData.app_description = "Administrador de tipos de usuarios"; // Type="Edm.String" MaxLength="999"/>
                    jsonData.detail = JSON.stringify(detail); // Type="Edm.String"/>
                    jsonData.deleteStatus = "1"; // Type="Edm.String" MaxLength="1"/>
                    this.getView().getModel("modeloDatos").create('/SystemLog', jsonData, {
                        success: function (oResult) {
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            resolve();
                        }.bind(this)
                    });
                }.bind(this));
            }

        });

    });

