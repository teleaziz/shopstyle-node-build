import '../../scripts/dependencies/app';
import './<%= dashName %>.scss';

import { HotReload }            from '../../scripts/decorators/hot-reload';
import { Component }            from '../../scripts/decorators/component';
import { View }                 from '../../scripts/decorators/view';
import { inject }               from '../../scripts/decorators/inject';
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
}
