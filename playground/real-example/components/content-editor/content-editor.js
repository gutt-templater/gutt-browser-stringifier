import ContentEditor from 'contenteditor'
import { ParagraphPlugin } from 'contenteditor/plugins/paragraph'
import { BreakLinePlugin } from 'contenteditor/plugins/break-line'
import { TextPlugin } from 'contenteditor/plugins/text'
import { HeaderPlugin } from 'contenteditor/plugins/header'
import { LinkPlugin } from 'contenteditor/plugins/link'
import { ImagePlugin } from 'contenteditor/plugins/image'
import { ListPlugin } from 'contenteditor/plugins/list'

import Component from '../../../libs/component'

export default class ContentEditorClass extends Component {
	constructor(node) {
		super(node)

		const plugins = {
			text: new TextPlugin(),
			breakLink: new BreakLinePlugin(),
			header: new HeaderPlugin(),
			paragraph: new ParagraphPlugin(),
			link: new LinkPlugin(),
			image: new ImagePlugin(),
			list: new ListPlugin()
		}

		this.editor = new ContentEditor(this.node, plugins)

		const css = document.createElement('link')

		css.setAttribute('href', '/client/out/contenteditor/rich-editor.css')
		css.setAttribute('rel', 'stylesheet')
		document.querySelector('head').appendChild(css)
	}
}
