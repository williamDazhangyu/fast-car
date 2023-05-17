import "reflect-metadata";
import { Component } from "../../../../src/annotation";

//永远不会被扫描
@Component
export default class excludeApp {}
