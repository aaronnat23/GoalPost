// Structured logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...data,
    };

    // In production, send to logging service (e.g., Datadog, LogDNA)
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
      this.sendToLoggingService(logData);
    }

    // Console output for development
    const consoleMethod = level === 'error' ? console.error :
                         level === 'warn' ? console.warn :
                         console.log;

    consoleMethod(JSON.stringify(logData, null, 2));
  }

  private sendToLoggingService(logData: any) {
    // Implement integration with logging service
    // e.g., fetch to Datadog, LogDNA, CloudWatch, etc.
    if (process.env.LOGGING_ENDPOINT) {
      fetch(process.env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      }).catch(err => {
        console.error('Failed to send log:', err);
      });
    }
  }

  debug(message: string, data?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: LogContext) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogContext) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | LogContext) {
    const data: LogContext = {};

    if (error instanceof Error) {
      data.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      Object.assign(data, error);
    }

    this.log('error', message, data);
  }

  // Job-specific logging
  jobStarted(jobId: string, type: string, payload: any) {
    this.info('Job started', {
      jobId,
      jobType: type,
      payload,
    });
  }

  jobCompleted(jobId: string, type: string, result: any) {
    this.info('Job completed', {
      jobId,
      jobType: type,
      result,
    });
  }

  jobFailed(jobId: string, type: string, error: Error) {
    this.error('Job failed', {
      jobId,
      jobType: type,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }

  // API request logging
  apiRequest(method: string, path: string, userId?: string) {
    this.info('API request', {
      method,
      path,
      userId,
    });
  }

  apiResponse(method: string, path: string, status: number, duration: number) {
    this.info('API response', {
      method,
      path,
      status,
      duration,
    });
  }
}

export const logger = new Logger();
