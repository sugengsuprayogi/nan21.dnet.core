package net.nan21.dnet.core.presenter.service.stream;

import net.nan21.dnet.core.api.service.IFileUploadService;
import net.nan21.dnet.core.api.service.IFileUploadServiceFactory;
import net.nan21.dnet.core.presenter.AbstractApplicationContextAware;

/**
 * 
 * @author amathe
 * 
 */
public class FileUploadServiceFactory extends AbstractApplicationContextAware
		implements IFileUploadServiceFactory {

	@Override
	public IFileUploadService create(String key) {
		IFileUploadService s = (IFileUploadService) this
				.getApplicationContext().getBean(key);
		return s;
	}

}
