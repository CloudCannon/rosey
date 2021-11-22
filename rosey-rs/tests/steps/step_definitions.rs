use std::cell::RefCell;
use std::str::FromStr;

use cucumber::gherkin::Step;
use cucumber::{given, then, when};
use json_dotpath::DotPaths;
use kuchiki::iter::{Descendants, Elements, Select};
use kuchiki::traits::TendrilSink;
use kuchiki::{Attributes, ElementData, NodeDataRef, NodeRef};
use regex::Regex;
use serde_json::Value;

use crate::{RoseyOptions, RoseyWorld};

// GIVENS

#[given(regex = "^I have an? (?:\"|')(.*)(?:\"|') file$")]
fn new_empty_file(world: &mut RoseyWorld, filename: String) {
    world.write_file(&filename, "");
}

#[given(regex = "^I have an? (?:\"|')(.*)(?:\"|') file with the content:$")]
fn new_file(world: &mut RoseyWorld, step: &Step, filename: String) {
    match &step.docstring {
        Some(contents) => {
            world.write_file(&filename, contents);
        }
        None => panic!("`{}` step expected a docstring", step.value),
    }
}

#[given(regex = "^I have an? (?:\"|')(.*)(?:\"|') file with the body:$")]
fn new_templated_file(world: &mut RoseyWorld, step: &Step, filename: String) {
    match &step.docstring {
        Some(contents) => {
            world.write_file(&filename, &template_file(contents));
        }
        None => panic!("`{}` step expected a docstring", step.value),
    }
}

// WHENS

#[when(regex = "^I run Rosey ([a-z]+)$")]
fn run_rosey(world: &mut RoseyWorld, command: String) {
    let options = RoseyOptions::default();
    world.run_rosey(command, options);
}

#[when(regex = "^I run Rosey ([a-z]+) with options:$")]
fn run_rosey_with_options(world: &mut RoseyWorld, step: &Step, command: String) {
    match &step.table {
        Some(table) => {
            let options = RoseyOptions::from(table);
            world.run_rosey(command, options);
        }
        None => panic!("`{}` step expected a docstring", step.value),
    }
}

// THENS

#[then(regex = "^(DEBUG )?I should see (?:\"|')(.*)(?:\"|') in (?:\"|')(.*)(?:\"|')$")]
fn file_does_contain(world: &mut RoseyWorld, debug: StepDebug, expected: String, filename: String) {
    assert!(world.check_file_exists(&filename));
    let contents = world.read_file(&filename);
    debug.log(&contents);
    assert!(contents.contains(&expected));
}

#[then(regex = "^(DEBUG )?I should not see (?:\"|')(.*)(?:\"|') in (?:\"|')(.*)(?:\"|')$")]
fn file_does_not_contain(
    world: &mut RoseyWorld,
    debug: StepDebug,
    expected: String,
    filename: String,
) {
    assert!(world.check_file_exists(&filename));
    let contents = world.read_file(&filename);
    debug.log(&contents);
    assert!(!contents.contains(&expected));
}

#[then(regex = "^I should see the file (?:\"|')(.*)(?:\"|')$")]
fn file_does_exist(world: &mut RoseyWorld, filename: String) {
    assert!(world.check_file_exists(&filename));
}

#[then(regex = "^I should not see the file (?:\"|')(.*)(?:\"|')$")]
fn file_does_not_exist(world: &mut RoseyWorld, filename: String) {
    assert!(!world.check_file_exists(&filename));
}

#[then(regex = "^(DEBUG )?I should see a selector (?:\"|')(.*)(?:\"|') in (?:\"|')(\\S*)(?:\"|')$")]
fn selector_exists(world: &mut RoseyWorld, debug: StepDebug, selector: String, filename: String) {
    assert!(world.check_file_exists(&filename));
    let contents = world.read_file(&filename);
    debug.log(&contents);
    let parsed_file = parse_html_file(&contents);
    assert!(select_nodes(&parsed_file, &selector).next().is_some());
}

#[then(
    regex = "^(DEBUG )?I should see a selector (?:\"|')(.*)(?:\"|') in (?:\"|')(.*)(?:\"|') with the attributes:$"
)]
fn selector_attributes(
    world: &mut RoseyWorld,
    step: &Step,
    debug: StepDebug,
    selector: String,
    filename: String,
) {
    assert!(world.check_file_exists(&filename));
    let contents = world.read_file(&filename);
    debug.log(&contents);
    let parsed_file = parse_html_file(&contents);

    'nodes: for node in select_nodes(&parsed_file, &selector) {
        let atts = node_attributes(&node);
        let attributes = atts.borrow_mut();
        let rows = &step
            .table
            .as_ref()
            .expect("This step requires a table")
            .rows;
        for row in rows {
            let attribute_key = unescape_pipes(&row[0]);
            let value = match attribute_key.as_ref() {
                "innerText" => node.text_contents(),
                _ => {
                    let value = attributes.get(attribute_key);
                    match value {
                        Some(value) => value.to_string(),
                        None => continue 'nodes,
                    }
                }
            };
            if value != unescape_pipes(&row[1]) {
                continue 'nodes;
            }
        }
        for attribute in attributes.map.keys() {
            let attribute_expected = rows
                .iter()
                .map(|row| &row[0])
                .any(|x| x == &attribute.local.to_string());
            if !attribute_expected {
                continue 'nodes;
            }
        }
        return;
    }
    panic!("No nodes found that exactly match all provided attributes");
}

#[then(regex = "^(DEBUG )?I should see (?:\"|')(\\S+\\.json)(?:\"|') containing the values:$")]
fn json_contains_values(world: &mut RoseyWorld, debug: StepDebug, step: &Step, filename: String) {
    assert!(world.check_file_exists(&filename));
    let contents = world.read_file(&filename);
    debug.log(&contents);
    let parsed_json = parse_json_file(&contents);
    let int_re = Regex::new(r"^int:(\d+)$").unwrap();

    for row in &step
        .table
        .as_ref()
        .expect("This step requires a table")
        .rows
    {
        if let Some(expected_int) = int_re.captures(&row[1]) {
            let value: i64 = parsed_json
                .dot_get(&row[0])
                .expect("JSON path lookup failed")
                .expect("JSON path yielded none");
            let expected_int: i64 = expected_int
                .get(1)
                .unwrap()
                .as_str()
                .parse()
                .expect("expected_int wasn't an int");
            assert_eq!(value, expected_int);
        } else {
            let value: String = parsed_json
                .dot_get(&row[0])
                .expect("JSON path lookup failed")
                .expect("JSON path yielded none");
            assert_eq!(value, row[1]);
        }
    }
}

// HELPERS

fn parse_json_file(json: &str) -> Value {
    serde_json::from_str(json).expect("File contained invalid JSON")
}

fn parse_html_file(html: &str) -> NodeRef {
    kuchiki::parse_html().one(html)
}

fn select_nodes(parsed_file: &NodeRef, selector: &str) -> Select<Elements<Descendants>> {
    parsed_file
        .select(selector)
        .expect("Valid selector was given")
}

fn node_attributes(node: &NodeDataRef<ElementData>) -> RefCell<Attributes> {
    node.as_node()
        .as_element()
        .expect("Given selector was an element")
        .attributes
        .clone()
}

fn unescape_pipes(table_value: &str) -> String {
    table_value.replace("\\PIPE", "|")
}

fn template_file(body_contents: &str) -> String {
    format!(
        r#"
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
        {}
    </body>
</html>
"#,
        body_contents
    )
}

// DEBUGGING

struct StepDebug(bool);

impl FromStr for StepDebug {
    type Err = &'static str;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "DEBUG " => Ok(StepDebug(true)),
            _ => Ok(StepDebug(false)),
        }
    }
}

impl StepDebug {
    fn log(&self, contents: &str) {
        if self.0 {
            println!("\n\nDEBUG:\n---\n{:?}\n---\n\n", contents);
        }
    }
}
