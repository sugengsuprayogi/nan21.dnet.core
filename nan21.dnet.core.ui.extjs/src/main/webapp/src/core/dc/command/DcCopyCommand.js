Ext.define("dnet.base.DcCopyCommand", {
	extend : "dnet.base.AbstractDcSyncCommand",

	dcApiMethod : dnet.base.DcActionsFactory.COPY,
	
	onExecute : function() {
		var dc = this.dc;
		//console.log("copy: 1-store.getCount() = "+dc.store.getCount() );
		//console.log("copy: 1-count dirty  = "+dc.store.data.filterBy(function(e) { return e.dirty}).getCount()  );

		var source = dc.getRecord();
		if (!source) {
			return;
		} 
		var target = source.copy();		 
		target.data.id = null;
		if (target.data.code) {
			target.data.code = null;
		}
		if (target.data.name) {
			target.data.name = 'Copy of ' + target.data.name;
		}
		target.phantom = true;
		target.dirty = true;
		Ext.data.Model.id(target);
		if (dc.dcContext) {
			dc.dcContext._applyContextData_(target);
		}
		dc.setRecord(target);
		dc.store.add(target);
		
		dc.fireEvent("afterDoNew", {
			dc : dc
		});
		//console.log("copy: 2-store.getCount() = "+dc.store.getCount() );
		//console.log("copy: 2-count dirty  = "+dc.store.data.filterBy(function(e) { return e.dirty}).getCount()  );

		//dc.setSelectedRecords( [ dc.record ]);
	},

	checkActionState : function() {
		if (dnet.base.DcActionsStateManager.isCopyDisabled(this.dc)) {
			throw ("Copying a record is not allowed.");
		}
	}

});
