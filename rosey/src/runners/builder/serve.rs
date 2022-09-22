use std::path::PathBuf;

use actix_files as fs;
use actix_web::{App, HttpServer};
use anyhow::{bail, Error};
use portpicker::pick_unused_port;

pub async fn serve_dir(dir: PathBuf) {
    if try_serve(dir.clone(), 3030).await.is_err() {
        match pick_unused_port() {
            Some(p) => {
                if try_serve(dir.clone(), p).await.is_err() {
                    eprintln!("Unable to serve the directory");
                    std::process::exit(1);
                }
            }
            None => {
                eprintln!("No available ports to serve on");
                std::process::exit(1);
            }
        }
    }
}

async fn try_serve(dir: PathBuf, port: u16) -> Result<(), Error> {
    println!("Serving {dir:?} at http://localhost:{port}");

    match HttpServer::new(move || {
        App::new().service(fs::Files::new("/", &dir).index_file("index.html"))
    })
    .bind(("127.0.0.1", port))
    {
        Ok(bound) => {
            let server = bound.run();
            if server.await.is_err() {
                bail!("Could not serve directory");
            }
        }
        Err(_) => {
            bail!("Could not serve directory");
        }
    }

    Ok(())
}
