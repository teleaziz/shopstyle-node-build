import '../../scripts/dependencies/app';

import { Service }  from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/service';
import { import }  from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/import';

@Service('<%= camelName %>')

/**
 * @class <%= className %>
 */
export class <%= className %> {
  @import
  $log: angular.ILogService;

  constructor() {
    // <%= humanName %> service initialized!
  }

  greet() {
    this.$log.info('Hello <%= humanName %>!');
  }
}
