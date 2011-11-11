Ext.define("dnet.base.AbstractDcvForm", {
	extend:  "Ext.form.Panel",
 
	// DNet properties
	
	_builder_: null,
	_elems_: null,
	_controller_: null,
    _mainViewName_: "main",
    _dcViewType_: "edit-form",	
    
    // defaults
    
    frame:true,
	border:false,
	bodyBorder:false,
	bodyPadding: '5 5 0 0',
	maskOnDisable: false,
	layout:"fit",
  	buttonAlign:"left",
  	bodyCls: 'dcv-edit-form',
  	
    fieldDefaults:{
  	   labelAlign:"right",
  	   labelWidth:100  
  	},
  	
    defaults: {
   	 	frame:false
       ,border:false
       ,bodyBorder:false
       ,bodyStyle: " background:transparent "
    },
     
    // deprecated
    
	 _is_filter_: false  
    ,_resourceBundle_:{}     
	,_bindable_: true	
	 
	,initComponent: function() {
    	 
    	this.maskOnDisable = false; 
 
		this._elems_ =  new Ext.util.MixedCollection();
		this._startDefine_();

		/* define elements */
		if (this._beforeDefineElements_()  !== false ) {
			this._defineElements_();
			this._afterDefineElements_();
		}
		this._elems_.each(this._postProcessElem_, this);
		/* build the ui, linking elements */
		if (this._beforeLinkElements_()  !== false) {
			this._linkElements_();
			this._afterLinkElements_();
		}
		 
		this._endDefine_();

		this.items = [ this._elems_.get(this._mainViewName_) ];
  
		this.initialConfig.trackResetOnLoad = false;
	 	 
		this.callParent(arguments);
		
		
		this._controller_.store.on("update", function(store, rec, op, eopts) {	
			//dnet.base.Logger.debug("dnet.base.AbstractDcvForm. store.on.update" );	 
			this.updateBound(rec);
			//this._controller_.commands["doSave"].locked = !this.getForm().isValid();
		}, this);
		
		/**
		 * use the first record from the result list as reference 
		 * see Store on write event handler defined in AbstractDc.
		 */
		this._controller_.store.on("write", function(store, operation, eopts) {	
			if (operation.action == "create") {
				this._applyContextRules_(operation.resultSet.records[0]);
			}
		}, this);
		
		this._controller_.store.on("datachanged", function(store, eopts) {	
			//dnet.base.Logger.debug("dnet.base.AbstractDcvForm. store.on.datachanged" );	 
			if(this.getForm().getRecord()) {
				this.updateBound(this._controller_.getRecord());
			}			
		}, this);
		
		
		 
		this._controller_.on("recordChange", function(evnt) {		
			//dnet.base.Logger.debug("dnet.base.AbstractDcvForm. controller.on.recordChange, form.dirty="+this.getForm().isDirty() );	 
			var newRecord = evnt.newRecord;
			var oldRecord = evnt.oldRecord;
			var newIdx = evnt.newIdx;
			if (newRecord != oldRecord) {
				this.onUnbind(oldRecord);
				this.onBind(newRecord);		
			} 
		}, this);	 
		
 
		this.on("afterrender", function() { 
			if ( this._controller_&& this._controller_.getRecord()) { 
				this.onBind(this._controller_.getRecord()); 
			} else { 
				this.onUnbind(null);
			}
			this._afterRender_();
			}, this);
		
		if (this._controller_.commands.doSave ) {
			this._controller_.commands.doSave.beforeExecute = Ext.Function.createInterceptor(
				this._controller_.commands.doSave.beforeExecute,
				function() {
					if(!this.getForm().isValid()) {
						Ext.Msg.show({
							title : "Validation info",	
							msg : "Form contains invalid data.<br> Please fix the errors then try again.",
							scope : this,
							icon : Ext.MessageBox.ERROR,
							buttons : Ext.MessageBox.OK
						});
						return false;
					} else {
						return true;	
					}					
				},this, -1 );
		}
//		this.getForm().on("validitychange", function(form, isValid, eopts) {
//			this._controller_.commands["doSave"].locked = !isValid;
//		}, this);
	}
 
	,_afterRender_: function() {
	}
    ,_startDefine_: function () {}
    ,_endDefine_: function () {}
    ,_getController_: function() { return this._controller_;}
    ,_getElement_: function(name) {
		try { 
			return Ext.getCmp( this._elems_.get(name).id);
		} catch(e) { /*if (console) { console.log(name+':'+ e.message);}*/ }
		}
    ,_getElementConfig_: function(name) {  return this._elems_.get(name); }
    
    ,_get_: function(name) { return this._getElement_(name);} 
    ,_getConfig_: function(name) {  return this._elems_.get(name); }
    
 
	,onBind:function(record) {
		//this.getForm().reset();
//		var msg = "null";
//		if (record) {
//			msg = record.data.name + ", dirty = "+record.dirty; 
//		}
		//dnet.base.Logger.debug("dnet.base.AbstractDcvForm.onBind => " + msg);
		
		if (record) {
			this.getForm().getFields().each(function(field) {
				if (field.dataIndex) {
					field._setRawValue_(record.data[field.dataIndex]);
				}						
				}); 
				
			this._applyContextRules_(record);
			this.getForm().isValid();
			//this.enable();
		}
		this._afterBind_(record);
	//}			
	}
	,onUnbind:function(record) {
		//this.getForm().reset();
//		var msg = "null";
//		if (record) {
//			msg = record.data.name+ ", dirty = "+record.dirty; 
//		}
		//dnet.base.Logger.debug("dnet.base.AbstractDcvForm.onUnbind => " +msg);
		 
		
		this.getForm().getFields().each(function(field) {
			if (field.dataIndex) {
				field.setRawValue(null);
				field.clearInvalid();				
			}
			field.disable();
			}); 
  		//???
  		//this.getForm().record = null;
		this._afterUnbind_(record);	
	}
	
	,_afterBind_: function(record) {}
	,_afterUnbind_: function(record) {}
	,afterEdit:function(record) { 
		this.updateBound(record); 
	}
	,afterReject:function(record) { 
		this.updateBound(record);  
	}
	 
	,updateBound:function(record) {
		var msg = "null";
		if (record) {
			//msg = record.data.name+ ", dirty = "+record.dirty; 
			//dnet.base.Logger.debug("dnet.base.AbstractDcvForm.updateBound => " +msg );
			this.getForm().loadRecord(record);
		}		
	}

	,_defineElements_: function () {}
    	,_beforeDefineElements_: function () {return true;}
    	,_afterDefineElements_: function () {}

    ,_linkElements_: function () {}
    	,_beforeLinkElements_: function () {return true;}
    	,_afterLinkElements_: function () {}
 
	,_applyContextRules_: function(record) {
		if(record == null || record == undefined) {
			return ;
		}
		var c = null; // component might not be rendered yet
		if (record.phantom) {
			this.getForm().getFields().each(function(item, index, length) {
				if (item.noEdit === true || item.noInsert  === true ) {
					item.disable();
				} else {
					item.enable();
				}
			});			 
		} else {
			this.getForm().getFields().each(function(item, index, length) {
				if (item.noEdit === true || item.noUpdate === true ) {
					item.disable();
				} else {
					item.enable();
				}
			});
		}
	}
	
	,_postProcessElem_ : function(item, idx, len) {
		item["_dcView_"] = this;
		if (item.fieldLabel == undefined) {
			Dnet.translateField(this._trl_, this._controller_._trl_,item);
		}
		return true;
	}
	
		/* get value from resource bundle for the specified key*/
	,_getRBValue_: function(k) {
		if (this._trl_ != null && this._trl_[k]) { return this._trl_[k]; }
		if (this._controller_._trl_ != null && this._controller_._trl_[k]) {
			return  this._controller_._trl_[k];
		} else {
			return k; 
		}
	} 

	 ,_showStackedViewElement_: function(svn, idx) {
		if (Ext.isNumber(idx) ) {
    		this._getElement_(svn).getLayout().setActiveItem(idx);
		} else {
			var ct = this._getElement_(svn);
			var cmp = this._getElement_(idx);
			if(cmp) {
				ct.getLayout().setActiveItem(cmp);
			} else {				
				ct.getLayout().setActiveItem( ct.items.indexOfKey(idx));
			}
			  
		}
	}
	
	,_isValid_: function() { 

		if (this.getForm().isValid()) {
			return true;
		} else {
			Ext.Msg.show({
	          title: 'Invalid data'
	         ,msg: 'Form contains invalid data.<br>Please correct values then try again. '
	         ,buttons: Ext.MessageBox.OK
	         ,scope:this
	         ,icon: Ext.MessageBox.ERROR
	      });
	      return false;
		}
	}
	
	
	,_getBuilder_: function() {
		if (this._builder_ == null) {
			this._builder_ = new dnet.base.DcvFormBuilder({dcv: this});
		}	
		return this._builder_;
	}
	
	
	
});