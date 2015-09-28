import '../../scripts/dependencies/app';

import { Service }  from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/service';

@Service('<%= camelName %>')

/**
 * @class <%= className %>
 */
export class <%= className %> {
  constructor() {
    // <%= humanName %> service initialized!
  }
}
