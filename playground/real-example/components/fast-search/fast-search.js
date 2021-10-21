import Component from '../../../libs/component'
import { emitEvent } from '../../../libs/helpers'

export default class FastSearch extends Component {
	events = {
		'input: [name="search"]': this.onSearchInput,
		'submit': this.onSubmit
	}

	onSearchInput(event) {
		emitEvent(this.node, 'search-change', {
			query: event.target.value
		})
	}

	onSubmit(event) {
		event.preventDefault()
	}
}
