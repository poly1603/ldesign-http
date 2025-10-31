import { ModuleWithProviders, NgModule } from '@angular/core'
import type { HttpClientConfig } from '@ldesign/http-core'
import { HttpService, HttpServiceConfig } from './http.service'

/**
 * Angular HTTP Module
 */
@NgModule({
  providers: [HttpService],
})
export class HttpModule {
  /**
   * 配置HTTP模块
   */
  static forRoot(config?: HttpClientConfig): ModuleWithProviders<HttpModule> {
    return {
      ngModule: HttpModule,
      providers: [
        {
          provide: HttpServiceConfig,
          useValue: config || {},
        },
        HttpService,
      ],
    }
  }
}
