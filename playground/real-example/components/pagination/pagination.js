import Component from '../../../libs/component'
import { emitEvent } from '../../../libs/helpers'

export default class Pagination extends Component {
	events = {
		'click: [data-item]': this.onPageClick
	}

	onPageClick(event) {
		event.preventDefault()
		emitEvent(this.node, 'page-change', {
			page: Number(event.target.dataset.item)
		})
	}
}
