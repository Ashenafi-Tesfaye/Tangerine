import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { take } from 'rxjs/operators'
import { TangyErrorHandler } from './tangy-error-handler.service';
import { _TRANSLATE } from './translation-marker';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  constructor(private errorHandler: TangyErrorHandler, private router: Router) { }
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    return next.handle(request)
  }
  /*
  intercept(request: HttpRequest<any>, next: HttpHandler) {
    return next.handle(request).subscribe(event => { }, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          this.errorHandler.handleError(_TRANSLATE('Permission Denied. Login to Continue'));
          this.router.navigate(['login']);
        }
        if (err.status === 404) {
          this.errorHandler.handleError(_TRANSLATE('Item Not Found'));
        }
        if (err.status === 403) {
          this.errorHandler.handleError(_TRANSLATE('You do not have access to the resource.'));
        }
      }
    });
  }
  */
}
