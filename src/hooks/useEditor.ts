import CharacterCount from "@tiptap/extension-character-count";
import BubbleMenu from "@tiptap/extension-bubble-menu";

import { v4 as uuidv4 } from "uuid";
import {
  useEditor,
  ReactNodeViewRenderer,
  textblockTypeInputRule,
} from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import StarterKit from "@tiptap/starter-kit";
import Code from "@tiptap/extension-code";
import Placeholder from "@tiptap/extension-placeholder";

import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";

import ImageView from "@/components/Editor/NodeViews/Image/Image";
import CodeBlockLowlight from "@/components/Editor/extensions/CodeBlockLowlight";
import { RichTextLink } from "@/components/Editor/extensions/link-text";
import TableView from "@/components/Editor/NodeViews/TableView";
import { DeleteCells } from "@/lib/tableShortcut";

interface props {
  content: string;
  onUpdate: () => void;
  folderPath: string;
}
const useTextEditor = ({ content, onUpdate, folderPath }: props) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: `prose h-full`,
        folderPath,
      },
    },
    extensions: [
      Table.extend({
        addNodeView() {
          return ReactNodeViewRenderer(TableView, {
            contentDOMElementTag: "table",
          });
        },
        addInputRules() {
          return [
            {
              find: /table(\r\n|\r|\n)/,
              type: this.type,
              handler({ state, range, match, commands }) {
                const { tr } = state;
                const { $from } = state.selection;
                const start = range.from;
                let end = range.to;

                const isEmptyLine =
                  $from.parent.textContent.trim() === match[0].slice(0, -1);
                if (isEmptyLine) {
                  tr.delete(tr.mapping.map(start), tr.mapping.map(end));
                  commands.insertTable({
                    rows: 2,
                    cols: 2,
                    withHeaderRow: true,
                  });
                }
              },
            },
          ];
        },
        addKeyboardShortcuts() {
          return {
            ...this.parent?.(),
            Backspace: DeleteCells,
            "Mod-Backspace": DeleteCells,
            Delete: DeleteCells,
            "Mod-Delete": DeleteCells,
          };
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      BubbleMenu.configure({
        element: document.querySelector(".menu") as HTMLElement,
      }),
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageView);
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            folderPath: {
              default: folderPath,
            },
          };
        },
        addInputRules() {
          return [
            {
              find: /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/,
              type: this.type,
              handler({ state, range, match }) {
                const { tr } = state;
                const { $from } = state.selection;
                const start = range.from;
                let end = range.to;

                const isEmptyLine =
                  $from.parent.textContent.trim() === match[0].slice(0, -1);
                if (isEmptyLine) {
                  //@ts-ignore
                  const node = this.type.create({
                    src: match[3],
                    alt: match[2],
                    title: match[4],
                  });
                  tr.insert(start - 1, node).delete(
                    tr.mapping.map(start),
                    tr.mapping.map(end),
                  );
                }
              },
            },
          ];
        },
      }),
      CharacterCount,
      OrderedList,
      BulletList,
      ListItem,
      Code.configure({
        HTMLAttributes: {
          class: "code",
        },
      }),
      CodeBlockLowlight,
      Heading.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            id: {
              default: "",
              parseHTML: () => uuidv4(),
            },
          };
        },
        addPasteRules() {
          return this.options.levels.map((level: number) => {
            return textblockTypeInputRule({
              find: new RegExp(`^(#{1,${level}})\\s$`),
              type: this.type,
              getAttributes: () => ({
                level,
                id: uuidv4(),
              }),
            });
          });
        },
        addInputRules() {
          return this.options.levels.map((level: number) => {
            return textblockTypeInputRule({
              find: new RegExp(`^(#{1,${level}})\\s$`),
              type: this.type,
              getAttributes: () => ({
                level,
                id: uuidv4(),
              }),
            });
          });
        },
      }),
      StarterKit.configure({
        orderedList: false,
        bulletList: false,
        listItem: false,
        codeBlock: false,
        code: false,
        heading: false,
      }),

      RichTextLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "link",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing here...",
      }),
    ],
    content,
    onUpdate,
  });

  return editor;
};
export default useTextEditor;
