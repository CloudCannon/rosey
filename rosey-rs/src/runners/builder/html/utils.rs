use std::{collections::BTreeMap, io::Write, path::Path};

use html5ever::{
    serialize::{HtmlSerializer, SerializeOpts, Serializer},
    tokenizer::{TokenSink, TokenSinkResult},
    QualName,
};

use crate::RoseyLocale;

use super::get_translated_asset;

pub struct TranslationRewriter<'a> {
    result: String,
    images_source: &'a Path,
    locale_key: &'a str,
    default_language: &'a str,
    locales: &'a BTreeMap<String, RoseyLocale>,
    tag: &'a str,
}

impl<'a> TranslationRewriter<'a> {
    pub fn new(
        images_source: &'a Path,
        locale_key: &'a str,
        default_language: &'a str,
        locales: &'a BTreeMap<String, RoseyLocale>,
        tag: &'a str,
    ) -> Self {
        TranslationRewriter {
            result: String::new(),
            images_source,
            locale_key,
            default_language,
            locales,
            tag,
        }
    }

    pub fn finish(self) -> String {
        self.result
    }
}

impl<'a> TokenSink for &mut TranslationRewriter<'a> {
    type Handle = ();

    fn process_token(
        &mut self,
        token: html5ever::tokenizer::Token,
        _line_number: u64,
    ) -> html5ever::tokenizer::TokenSinkResult<Self::Handle> {
        match token {
            html5ever::tokenizer::Token::TagToken(html5ever::tokenizer::Tag {
                name,
                self_closing,
                attrs,
                kind,
            }) => {
                self.result.push('<');
                if kind == html5ever::tokenizer::TagKind::EndTag {
                    self.result.push('/');
                }
                self.result.push_str(&name);
                let has_download = attrs.iter().any(|attr| &attr.name.local == "download");
                let custom_asset_attr = attrs
                    .iter()
                    .find(|attr| attr.name.local == format!("{}-asset-attrs", self.tag))
                    .map(|attr| &attr.value);
                attrs.iter().for_each(|attr| {
                    self.result.push(' ');
                    self.result.push_str(&attr.name.local);
                    if attr.value.is_empty() {
                        return;
                    }
                    self.result.push_str("=\"");
                    match (&name as &str, &attr.name.local as &str, custom_asset_attr) {
                        (_, attr_name, Some(custom_asset_attr))
                            if attr_name == (custom_asset_attr as &str) =>
                        {
                            if let Some(translated_asset) = get_translated_asset(
                                &attr.value,
                                self.images_source,
                                self.locale_key,
                            ) {
                                self.result.push_str(&format!("/{translated_asset}"));
                            }
                        }
                        ("img" | "video" | "audio" | "source", "src", _) => {
                            if let Some(translated_asset) = get_translated_asset(
                                &attr.value,
                                self.images_source,
                                self.locale_key,
                            ) {
                                self.result.push_str(&format!("/{translated_asset}"));
                            }
                        }
                        ("a", "href", _) if has_download => {
                            if let Some(translated_asset) = get_translated_asset(
                                &attr.value,
                                self.images_source,
                                self.locale_key,
                            ) {
                                self.result.push_str(&format!("/{translated_asset}"));
                            }
                        }
                        ("a", "href", _) if !has_download => {
                            let href_path = Path::new(&attr.value as &str);
                            let ext = href_path.extension().map(|ext| ext.to_str().unwrap());

                            if !href_path.is_absolute()
                                || !matches!(ext, Some("html") | Some("htm") | None)
                                || self
                                    .locales
                                    .keys()
                                    .chain(std::iter::once(&self.default_language.to_string()))
                                    .any(|key| attr.value.starts_with(&format!("/{key}")))
                            {
                                self.result.push_str(&attr.value);
                            } else {
                                self.result
                                    .push_str(&format!("/{}{}", self.locale_key, &attr.value));
                            }
                        }
                        ("img", "srcset", _) => {
                            let srcset = &attr
                                .value
                                .split(',')
                                .map(|part| {
                                    let mut split = part.split(' ');
                                    (split.next(), split.next(), part)
                                })
                                .map(|(src, width, original_part)| {
                                    if let (Some(src), Some(width)) = (src, width) {
                                        if let Some(translated_src) = get_translated_asset(
                                            src,
                                            self.images_source,
                                            self.locale_key,
                                        ) {
                                            return format!("/{} {}", translated_src, width);
                                        }
                                    }
                                    original_part.to_string()
                                })
                                .fold(String::default(), |mut acc, part| {
                                    if !acc.is_empty() {
                                        acc.push(',');
                                    }
                                    acc.push_str(&part);
                                    acc
                                });
                            self.result.push_str(srcset);
                        }
                        _ => {
                            self.result.push_str(&attr.value);
                        }
                    }
                    self.result.push('"');
                });
                if self_closing {
                    self.result.push_str("/>");
                } else {
                    self.result.push('>');
                }
            }
            html5ever::tokenizer::Token::CharacterTokens(tendril) => self.result.push_str(&tendril),
						html5ever::tokenizer::Token::CommentToken(tendril) => {
							self.result.push_str("<!--");
							self.result.push_str(&tendril);
							self.result.push_str("-->");
						},
            html5ever::tokenizer::Token::DoctypeToken(html5ever::tokenizer::Doctype{ name: Some(name), ..}) => {
							self.result.push_str("<!DOCTYPE ");
							self.result.push_str(&name);
							self.result.push('>');
						},
						html5ever::tokenizer::Token::EOFToken => {},
            token => eprintln!("WARNING: Found unsupported token in translation. This token will be skipped in the output: {token:?}"),
        }
        TokenSinkResult::Continue
    }
}

pub struct RoseySerializer<Wr: Write> {
    serializer: HtmlSerializer<Wr>,
}

impl<Wr: Write> RoseySerializer<Wr> {
    pub fn new(writer: Wr) -> Self {
        RoseySerializer {
            serializer: HtmlSerializer::new(
                writer,
                SerializeOpts {
                    traversal_scope: html5ever::serialize::TraversalScope::IncludeNode,
                    ..Default::default()
                },
            ),
        }
    }
}

impl<Wr: Write> Serializer for RoseySerializer<Wr> {
    fn start_elem<'a, AttrIter>(&mut self, name: QualName, attrs: AttrIter) -> std::io::Result<()>
    where
        AttrIter: Iterator<Item = html5ever::serialize::AttrRef<'a>>,
    {
        self.serializer.start_elem(name, attrs)
    }

    fn end_elem(&mut self, name: QualName) -> std::io::Result<()> {
        self.serializer.end_elem(name)
    }

    fn write_text(&mut self, text: &str) -> std::io::Result<()> {
        self.serializer.writer.write_all(text.as_bytes())
    }

    fn write_comment(&mut self, text: &str) -> std::io::Result<()> {
        self.serializer.write_comment(text)
    }

    fn write_doctype(&mut self, name: &str) -> std::io::Result<()> {
        self.serializer.write_doctype(name)
    }

    fn write_processing_instruction(&mut self, target: &str, data: &str) -> std::io::Result<()> {
        self.serializer.write_processing_instruction(target, data)
    }
}
