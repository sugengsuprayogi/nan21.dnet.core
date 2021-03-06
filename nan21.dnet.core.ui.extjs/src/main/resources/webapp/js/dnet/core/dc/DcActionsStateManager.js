/**
 * Singleton class used to implement the state management rules for the
 * registered actions.
 */

dnet.core.dc.DcActionsStateManager = {

	applyStates : function(dc, ifNeeded) { 
		var flags = this._getFlags(dc);
		
		if (ifNeeded && !this.needsToRun(dc,flags ) ) {  
			return;
		}
		
		var names = dc.actionNames;
		if ((flags.hasParent && flags.parentIsNull)
				|| (flags.hasParent && flags.parentIsNew)) {
			this.disableAll(dc, names);
			return;
		}
		for ( var i = 0, l = names.length; i < l; i++) {
			var n = names[i];
			var an = "do" + n;
			if(dc.commands[an].locked === true) {
				dc.actions[an].setDisabled(true);
			} else {
				var b = this["_is" + n + "Disabled"](flags);
				dc.actions[an].setDisabled(b);
			}			
		}
		dc.lastStateManagerFlags =  flags;
	},

	needsToRun: function(dc, newFlags) {
		if (dc.lastStateManagerFlags == null) {
			return true;
		} else {
			var last = dc.lastStateManagerFlags;
			for(var f in newFlags) {
				//console.log(f+ 'new='+newFlags[f] + ' last='+last[f] );
				if (newFlags[f] != last[f] ) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	
	disableAll : function(dc, names) {
		for ( var i = 0, l = names.length; i < l; i++) {
			var n = names[i];
			dc.actions["do" + n].setDisabled(true);
		}
	},

	/* public helpers */

	isSaveEnabled : function(dc) {
		return this._isSaveEnabled(this._getFlagsSave(dc));
	},
	
	isSaveDisabled : function(dc) {
		return !this.isSaveEnabled(dc);
	},

	isCancelEnabled : function(dc) {
		return this._isCancelEnabled(this._getFlagsCancel(dc));
	},
	
	isCancelDisabled : function(dc) {
		return !this.isCancelEnabled(dc);
	},

	isQueryDisabled : function(dc) {
		return this._isQueryDisabled(this._getFlagsQuery(dc));
	},
	
	isQueryEnabled : function(dc) {
		return !this.isQueryDisabled(dc);
	},

	isNewDisabled : function(dc) {
		return this._isNewDisabled(this._getFlagsNew(dc));
	},
	
	isNewEnabled : function(dc) {
		return !this.isNewDisabled(dc);
	},

	isCopyDisabled : function(dc) {
		return this._isCopyDisabled(this._getFlagsCopy(dc));
	},
	
	isCopyEnabled : function(dc) {
		return !this.isCopyDisabled(dc);
	},

	isDeleteDisabled : function(dc) {
		return this._isDeleteDisabled(this._getFlagsDelete(dc));
	},
	
	isDeleteEnabled : function(dc) {
		return !this.isDeleteDisabled(dc);
	},

	isPrevRecDisabled : function(dc) {
		return this._isPrevRecDisabled(this._getFlagsPrevRec(dc));
	},
	
	isPrevRecEnabled : function(dc) {
		return !this.isPrevRecDisabled(dc);
	},
	
	isNextRecDisabled : function(dc) {
		return this._isNextRecDisabled(this._getFlagsNextRec(dc));
	},
	
	isNextRecEnabled : function(dc) {
		return !this.isNextRecDisabled(dc);
	},
	
	isReloadRecDisabled : function(dc) {
		return this._isReloadRecDisabled(this._getFlagsReloadRec(dc));
	},
	
	isReloadRecEnabled : function(dc) {
		return !this.isReloadRecDisabled(dc);
	},

	isEditOutDisabled : function(dc) {
		return this._isEditOutDisabled(this._getFlagsEditOut(dc));
	},
	
	isEditOutEnabled : function(dc) {
		return !this.isEditOutDisabled(dc);
	},

	/* private helpers */

	_getFlags : function(dc) {
		// console.log("recordIsNull="+Ext.isEmpty(dc.record) );
		var flags = {
			isReadOnly : dc.isReadOnly(),
			isStoreDirty : dc.isStoreDirty(),
			isDirty : dc.isDirty(),
			isAnyChildDirty : dc.isAnyChildDirty(),
			recordIsNull : Ext.isEmpty(dc.record),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit,
			selectedRecordsLength : dc.getSelectedRecords().length,
			storeCount : dc.store.getCount()
		};
		this._getParentFlags(dc, flags);
		return flags;
	},

	_getParentFlags : function(dc, flags) {
		var hasParent = (dc.getParent() != null);
		var parentIsNull = (hasParent && !dc.getParent().getRecord()) ? true
				: false;
		var parentIsNew = (hasParent && !parentIsNull && dc.getParent().record.phantom) ? true
				: false;
				
		var parentisReadOnly = (hasParent && !parentIsNull && dc.getParent().isReadOnly()) ? true
				: false;		
		flags.hasParent = hasParent;
		flags.parentIsNull = parentIsNull;
		flags.parentIsNew = parentIsNew;
		flags.parentisReadOnly = parentisReadOnly;
	},

	/* decision makers implementation */

	_isQueryDisabled : function(flags) {
		return flags.isDirty || (flags.hasParent && flags.parentIsNull)
				|| (flags.hasParent && flags.parentIsNew);
	},

	_isQueryEnabled : function(flags) {
		return !this._isQueryDisabled(flags);
	},

	_getFlagsQuery : function(dc) {
		var flags = {
			isDirty : dc.isDirty()
		};
		this._getParentFlags(dc, flags);
		return flags;
	},

	_isClearQueryDisabled : function(flags) {
		return true;
	},

	_isClearQueryEnabled : function(flags) {
		return !this._isClearQueryDisabled(flags);
	},

	_isNewDisabled : function(flags) {
		return (flags.isReadOnly || flags.isAnyChildDirty || (flags.isCurrentRecordDirty && !flags.multiEdit));
	},

	_isNewEnabled : function(flags) {
		return !this._isNewDisabled(flags);
	},

	_getFlagsNew : function(dc) {
		return {
			isReadOnly : dc.isReadOnly(),
			isAnyChildDirty : dc.isAnyChildDirty(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit
		};
	},

	_isCopyDisabled : function(flags) {
		return (flags.isReadOnly || flags.recordIsNull || flags.selectedRecordsLength != 1
				|| flags.storeCount == 0 || flags.isAnyChildDirty || (flags.isCurrentRecordDirty && !flags.multiEdit));
	},

	_isCopyEnabled : function(flags) {
		return !this._isCopyDisabled(flags);
	},

	_getFlagsCopy : function(dc) {
		return {
			isReadOnly : dc.isReadOnly(),
			isAnyChildDirty : dc.isAnyChildDirty(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit,
			recordIsNull : Ext.isEmpty(dc.record),
			storeCount : dc.store.getCount(),
			selectedRecordsLength : dc.getSelectedRecords().length
		};
	},

	_isSaveEnabled : function(flags) {
		return (!flags.isReadOnly && (flags.isCurrentRecordDirty || flags.isStoreDirty) );
	},
	_isSaveDisabled : function(flags) {
		return !this._isSaveEnabled(flags);
	},
	_getFlagsSave : function(dc) {
		return {
			isReadOnly : dc.isReadOnly(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			isStoreDirty : dc.isStoreDirty()
		};
	},

	_isCancelEnabled : function(flags) {
		return (flags.isDirty);
	},

	_isCancelDisabled : function(flags) {
		return !this._isCancelEnabled(flags);
	},

	_getFlagsCancel : function(dc) {
		return {
			isDirty : dc.isDirty()
		};
	},

	_isDeleteDisabled : function(flags) {		 
		return (flags.isReadOnly || flags.selectedRecordsLength == 0 || flags.isAnyChildDirty || flags.storeCount == 0|| (flags.isCurrentRecordDirty && !flags.multiEdit));
	},

	_isDeleteEnabled : function(flags) {
		return !this._isDeleteDisabled(flags);
	},

	_getFlagsDelete : function(dc) {
		return {
			isReadOnly : dc.isReadOnly(),
			isAnyChildDirty : dc.isAnyChildDirty(),
			selectedRecordsLength : dc.getSelectedRecords().length,
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit,
			storeCount : dc.store.getCount()
		};
	},

	_isPrevRecDisabled : function(flags) {
		return (flags.storeCount == 0
				|| (flags.isCurrentRecordDirty && !flags.multiEdit) || flags.isAnyChildDirty);
	},

	_isPrevRecEnabled : function(flags) {
		return !this._isPrevRecDisabled(flags);
	},

	_getFlagsPrevRec : function(dc) {
		return {
			isAnyChildDirty : dc.isAnyChildDirty(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit,
			storeCount : dc.store.getCount()
		};
	},

	_isNextRecDisabled : function(flags) {
		return (flags.storeCount == 0
				|| (flags.isCurrentRecordDirty && !flags.multiEdit) || flags.isAnyChildDirty); // and
	},

	_isNextRecEnabled : function(flags) {
		return !this._isNextRecDisabled(flags);
	},

	_getFlagsNextRec : function(dc) {
		return {
			isAnyChildDirty : dc.isAnyChildDirty(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit,
			storeCount : dc.store.getCount()
		};
	},

	_isReloadRecDisabled : function(flags) {
		return (flags.storeCount == 0 || (flags.isCurrentRecordDirty));
	},

	_isReloadRecEnabled : function(flags) {
		return !this._isReloadRecDisabled(flags);
	},

	_getFlagsReloadRec : function(dc) {
		return {
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			storeCount : dc.store.getCount()
		};
	},

	_isEditInEnabled : function(flags) {
		!this._isEditInDisabled(flags);
	},
	_isEditInDisabled : function(flags) {
		return flags.recordIsNull;
	},
	_getFlagsEditIn : function(dc) {
		return {
			recordIsNull : Ext.isEmpty(dc.record)
		};
	},

	_isEditOutDisabled : function(flags) {
		return (flags.isAnyChildDirty || (flags.isCurrentRecordDirty && !flags.multiEdit));
	},

	_isEditOutEnabled : function(flags) {
		return !this._isEditOutDisabled(flags);
	},

	_getFlagsEditOut : function(dc) {
		return {
			isAnyChildDirty : dc.isAnyChildDirty(),
			isCurrentRecordDirty : dc.isCurrentRecordDirty(),
			multiEdit : dc.multiEdit
		};
	}
};