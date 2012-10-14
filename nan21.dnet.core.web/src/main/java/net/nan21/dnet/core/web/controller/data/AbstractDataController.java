package net.nan21.dnet.core.web.controller.data;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.nan21.dnet.core.api.ISystemConfig;
import net.nan21.dnet.core.api.security.IAuthorizationFactory;
import net.nan21.dnet.core.api.session.Params;
import net.nan21.dnet.core.api.session.Session;
import net.nan21.dnet.core.api.session.User;
import net.nan21.dnet.core.api.session.UserProfile;
import net.nan21.dnet.core.security.NotAuthorizedRequestException;
import net.nan21.dnet.core.security.SessionUser;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.WebApplicationContext;

@Controller
public class AbstractDataController {

	protected String resourceName;
	protected String dataFormat;

	@Autowired
	private WebApplicationContext webappContext;

	private ISystemConfig systemConfig;

	private IAuthorizationFactory authorizationFactory;

	final static Logger logger = LoggerFactory
			.getLogger(AbstractDataController.class);
	protected final static int FILE_TRANSFER_BUFFER_SIZE = 4 * 1024;

	protected void prepareRequest(HttpServletRequest request,
			HttpServletResponse response) throws Exception {
		request.setCharacterEncoding("UTF-8");
		response.setCharacterEncoding("UTF-8");

		SessionUser su;
		User user;
		Params params;
		UserProfile profile;

		try {
			su = (SessionUser) SecurityContextHolder.getContext()
					.getAuthentication().getPrincipal();
			user = (User) su.getUser();
			params = (Params) su.getParams();
			profile = new UserProfile(su.isAdministrator(), su.getRoles());

		} catch (ClassCastException e) {
			throw new Exception("<b>Session expired.</b>"
					+ "<br> Logout from application and login again.");
		}

		Session.user.set(user);
		Session.profile.set(profile);
		Session.params.set(params);

		String checkIp = this.systemConfig.getSysParamValue("SESSION_CHECK_IP");
		if (checkIp != null && checkIp.equals("true")) {
			String ip = request.getRemoteAddr();
			if (!su.getClientIp().equals(ip)) {
				logger.debug("Request comes from different IP as expected. Expected: "
						+ su.getClientIp() + ", real " + ip);
				throw new Exception(
						"Security settings do not allow to process request. Check log file for details.");
			}
		}

		String checkAgent = this.systemConfig
				.getSysParamValue("SESSION_CHECK_USER_AGENT");
		if (checkAgent != null && checkAgent.equals("true")) {
			String agent = request.getHeader("User-Agent");
			if (!su.getUserAgent().equals(agent)) {
				logger.debug("Request comes from different user-agent as expected. Expected: "
						+ su.getUserAgent() + ", real " + agent);
				throw new Exception(
						"Security settings do not allow to process request. Check log file for details.");
			}
		}
	}

	protected void finishRequest() {
		Session.user.set(null);
		Session.params.set(null);
	}

	public String getResourceName() {
		return resourceName;
	}

	public void setResourceName(String resourceName) {
		this.resourceName = resourceName;
	}

	public String getDataFormat() {
		return dataFormat;
	}

	public void setDataFormat(String dataFormat) {
		this.dataFormat = dataFormat;
	}

	public WebApplicationContext getWebappContext() {
		return webappContext;
	}

	public void setWebappContext(WebApplicationContext webappContext) {
		this.webappContext = webappContext;
	}

	/**
	 * Get system configuration object. If it is null attempts to retrieve it
	 * from Spring context.
	 * 
	 * @return
	 */
	public ISystemConfig getSystemConfig() {
		if (this.systemConfig == null) {
			this.systemConfig = this.getWebappContext().getBean(
					ISystemConfig.class);
		}
		return systemConfig;
	}

	/**
	 * Set system configuration object
	 * 
	 * @param systemConfig
	 */
	public void setSystemConfig(ISystemConfig systemConfig) {
		this.systemConfig = systemConfig;
	}

	@ExceptionHandler(value = NotAuthorizedRequestException.class)
	protected String handleException(NotAuthorizedRequestException e,
			HttpServletResponse response) throws IOException {
		// logger.error("Exception occured during transactional request execution: ",
		// e.getCause());
		// e.printStackTrace();
		response.setStatus(403);
		if (e.getCause() != null) {
			response.getOutputStream().print(e.getCause().getMessage());
		} else {
			response.getOutputStream().print(e.getMessage());
		}
		return null; // e.getLocalizedMessage();
	}

	@ExceptionHandler(value = Exception.class)
	protected String handleException(Exception e, HttpServletResponse response)
			throws IOException {
		if (e instanceof NotAuthorizedRequestException) {
			return this.handleException((NotAuthorizedRequestException) e,
					response);
		} else {
			String msg = null;

			Exception exc = e;
			if (e instanceof InvocationTargetException) {
				exc = (Exception) ((InvocationTargetException) e)
						.getTargetException();
			}
			if (exc.getCause() != null) {
				exc = (Exception) exc.getCause();
			}

			exc.printStackTrace();
			response.setStatus(500);
			response.getOutputStream().print(exc.getMessage());

			return null; // e.getLocalizedMessage();
		}

	}

	protected void sendFile(File file, ServletOutputStream stream)
			throws IOException {
		InputStream in = null;
		try {
			in = new BufferedInputStream(new FileInputStream(file));
			byte[] buf = new byte[FILE_TRANSFER_BUFFER_SIZE];
			int bytesRead;
			while ((bytesRead = in.read(buf)) != -1) {
				stream.write(buf, 0, bytesRead);
			}
		} finally {
			if (in != null)
				in.close();
		}
		stream.flush();
	}

	protected void sendFile(InputStream inputStream, ServletOutputStream stream)
			throws IOException {
		try {
			byte[] buf = new byte[FILE_TRANSFER_BUFFER_SIZE];
			int bytesRead;
			while ((bytesRead = inputStream.read(buf)) != -1) {
				stream.write(buf, 0, bytesRead);
			}
		} finally {
			if (inputStream != null)
				inputStream.close();
		}
		stream.flush();
	}

	public IAuthorizationFactory getAuthorizationFactory() {
		return authorizationFactory;
	}

	public void setAuthorizationFactory(
			IAuthorizationFactory authorizationFactory) {
		this.authorizationFactory = authorizationFactory;
	}

}
