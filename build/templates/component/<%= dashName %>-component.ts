import '../../scripts/dependencies/app';
import './<%= dashName %>.scss';

import { HotReload }            from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/hot-reload';
import { Component }            from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/component';
import { View }                 from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/view';
import { inject }               from '@popsugar/shopstyle-node-common/dist/client/scripts/decorators/inject';
import { <%= className %> }     from './<%= dashName %>-service';

@HotReload(module)

@Component({
  selector: '<%= dashName %>'
})

@View({
  templateUrl: './<%= dashName %>.html'
})

/**
 * @class <%= className %>Component
 */
export class <%= className %>Component {
  @inject
  private <%= camelName %>: <%= className %>;

  constructor() {
    this.<%= camelName %>.greet();
  }
}
